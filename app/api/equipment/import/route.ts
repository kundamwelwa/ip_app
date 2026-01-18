import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Increase timeout for large imports (5 minutes)
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { equipment } = body;

    if (!Array.isArray(equipment)) {
      return NextResponse.json(
        { error: "Equipment data must be an array" },
        { status: 400 }
      );
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process in batches to avoid timeout and improve performance
    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < equipment.length; i += BATCH_SIZE) {
      batches.push(equipment.slice(i, i + BATCH_SIZE));
    }

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      // Process batch (No transaction wrapper to avoid timeouts/connection issues with Supabase Pooler)
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} items...`);

      for (const item of batch) {
        try {
          // Validate required fields
          if (!item.name || !item.type) {
            results.failed++;
            results.errors.push(`Missing required fields for equipment: ${item.name || "unknown"}`);
            continue;
          }

          // Check if equipment already exists (by MAC or Name)
          let equipmentId: string;
          let existingEquipment = null;

          if (item.macAddress) {
            existingEquipment = await prisma.equipment.findUnique({
              where: { macAddress: item.macAddress },
            });
          }

          if (!existingEquipment && item.name) {
            existingEquipment = await prisma.equipment.findFirst({
              where: { name: item.name },
            });
          }

          const equipmentData = {
            name: item.name,
            type: item.type.toUpperCase(),
            model: item.model || null,
            manufacturer: item.manufacturer || null,
            macAddress: item.macAddress || null,
            serialNumber: item.serialNumber || null,
            location: item.location || null,
            operator: item.operator || null,
            description: item.description || null,
            notes: item.notes || null,
            status: item.status?.toUpperCase() || "OFFLINE",
            meshStrength: item.meshStrength ? parseInt(item.meshStrength) : null,
            nodeId: item.nodeId || null,
          };

          if (existingEquipment) {
            // Update existing equipment
            const updatedEquipment = await prisma.equipment.update({
              where: { id: existingEquipment.id },
              data: equipmentData,
            });
            equipmentId = updatedEquipment.id;
          } else {
            // Create new equipment
            const newEquipment = await prisma.equipment.create({
              data: equipmentData,
            });
            equipmentId = newEquipment.id;
          }

          // Variable for audit log use
          const equipmentName = item.name;

          // Handle IP Addresses Assignment (supports multiple IPs per equipment)
          const ipAddresses = item.ipAddresses || (item.ipAddress ? [item.ipAddress] : []);

          if (ipAddresses.length > 0) {
            // Process all IP addresses for this equipment
            for (const ipData of ipAddresses) {
              try {
                // Handle both object format { address, subnet, gateway, ... } and string format
                const ipAddress = typeof ipData === 'string' ? ipData : ipData.address;
                const subnet = typeof ipData === 'object' ? (ipData.subnet || '255.255.255.0') : '255.255.255.0';
                const gateway = typeof ipData === 'object' ? (ipData.gateway || null) : null;
                const dns = typeof ipData === 'object' ? (ipData.dns || null) : null;
                const ipNotes = typeof ipData === 'object' ? (ipData.notes || null) : null;

                if (!ipAddress) {
                  results.errors.push(`Equipment ${item.name}: Invalid IP address data`);
                  continue;
                }

                // Check if IP address already exists
                const existingIP = await prisma.iPAddress.findUnique({
                  where: { address: ipAddress },
                  include: {
                    assignments: {
                      where: { isActive: true },
                      include: { equipment: { select: { name: true } } }
                    }
                  }
                });

                let ipAddressId: string;

                if (existingIP) {
                  // IP exists - check if it's already assigned
                  if (existingIP.status === 'ASSIGNED' && existingIP.assignments.length > 0) {
                    const assignedTo = existingIP.assignments[0].equipment?.name || 'unknown';
                    // Allow stealing/reassigning if user intends (but here we just warn if it's different equipment)
                    // If it's the SAME equipment, we just update.
                    if (existingIP.assignments[0].equipmentId !== equipmentId) {
                      results.errors.push(
                        `Equipment ${item.name}: IP ${ipAddress} is already assigned to "${assignedTo}". Skipping assignment.`
                      );
                      continue;
                    }
                  }

                  // Update existing IP record
                  await prisma.iPAddress.update({
                    where: { id: existingIP.id },
                    data: {
                      status: 'ASSIGNED',
                      subnet: subnet,
                      gateway: gateway,
                      dns: dns,
                      notes: ipNotes || existingIP.notes,
                    }
                  });
                  ipAddressId = existingIP.id;
                } else {
                  // Create new IP address record
                  const newIP = await prisma.iPAddress.create({
                    data: {
                      address: ipAddress,
                      subnet: subnet,
                      gateway: gateway,
                      dns: dns,
                      notes: ipNotes,
                      status: 'ASSIGNED',
                      isReserved: false
                    }
                  });
                  ipAddressId = newIP.id;
                }

                // Check if assignment already exists
                const existingAssignment = await prisma.iPAssignment.findFirst({
                  where: {
                    ipAddressId: ipAddressId,
                    equipmentId: equipmentId,
                    isActive: true,
                  }
                });

                if (!existingAssignment) {
                  // Create IP assignment linking equipment to IP
                  await prisma.iPAssignment.create({
                    data: {
                      ipAddressId: ipAddressId,
                      equipmentId: equipmentId,
                      userId: session.user?.id || "system",
                      isActive: true,
                      notes: ipNotes || `Imported with equipment ${item.name}`
                    }
                  });

                  // Create audit log for IP assignment
                  await prisma.auditLog.create({
                    data: {
                      action: "IP_ASSIGNED",
                      entityType: "IP_ADDRESS",
                      entityId: ipAddressId,
                      userId: session.user?.id || "system",
                      ipAddressId: ipAddressId,
                      equipmentId: equipmentId,
                      details: {
                        ipAddress: ipAddress,
                        equipmentName: item.name,
                        imported: true
                      }
                    }
                  });
                }
              } catch (ipError) {
                const ipAddress = typeof ipData === 'string' ? ipData : ipData?.address || 'unknown';
                results.errors.push(
                  `Equipment ${item.name}: Failed to create/assign IP ${ipAddress}: ${ipError instanceof Error ? ipError.message : 'Unknown error'}`
                );
              }
            }
          }

          // Create audit log
          await prisma.auditLog.create({
            data: {
              action: existingEquipment ? "EQUIPMENT_UPDATED" : "EQUIPMENT_IMPORTED",
              entityType: "EQUIPMENT",
              entityId: equipmentId,
              userId: session.user?.id || "system",
              equipmentId: equipmentId,
              details: {
                name: item.name,
                type: item.type,
                importedBy: session.user?.email,
                ipAddressCount: ipAddresses.length,
              },
            },
          });

          results.successful++;
        } catch (error) {
          console.error(`Status 500 details: Failed to process item ${item.name}`, error);
          results.failed++;
          results.errors.push(
            `Failed to import ${item.name}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error("Error importing equipment:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
}

