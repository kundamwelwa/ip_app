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
          const ipAddresses = item.ipAddresses || (item.ipAddress ? [item.ipAddress] : []);

          // Determine if this is a real equipment assignment or a status update (Available/Reserved)
          // We look at the first IP's status, as they are grouped by status/row in the parser
          const primaryStatus = ipAddresses[0]?.status || 'ASSIGNED';
          const isEquipment = primaryStatus === 'ASSIGNED';

          // Validate required fields for Equipment
          if (isEquipment && (!item.name || !item.type)) {
            results.failed++;
            results.errors.push(`Missing required fields for equipment: ${item.name || "unknown"}`);
            continue;
          }

          let equipmentId: string | null = null;
          let existingEquipment = null;

          // Only manage Equipment record if it is ASSIGNED
          if (isEquipment) {
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
          }

          // Handle IP Addresses
          if (ipAddresses.length > 0) {
            for (const ipData of ipAddresses) {
              try {
                const ipAddress = typeof ipData === 'string' ? ipData : ipData.address;
                const subnet = typeof ipData === 'object' ? (ipData.subnet || '255.255.255.0') : '255.255.255.0';
                const gateway = typeof ipData === 'object' ? (ipData.gateway || null) : null;
                const dns = typeof ipData === 'object' ? (ipData.dns || null) : null;
                const ipNotes = typeof ipData === 'object' ? (ipData.notes || null) : null;
                const status = (typeof ipData === 'object' && ipData.status) ? ipData.status : 'ASSIGNED';

                if (!ipAddress) {
                  results.errors.push(`Invalid IP address data`);
                  continue;
                }

                // Upsert IP Address logic
                let ipRef = await prisma.iPAddress.findUnique({
                  where: { address: ipAddress },
                });

                if (ipRef) {
                  // Update existing IP
                  await prisma.iPAddress.update({
                    where: { id: ipRef.id },
                    data: {
                      subnet,
                      gateway,
                      dns,
                      notes: ipNotes || ipRef.notes,
                      status: status === 'RESERVED' ? 'RESERVED' : (status === 'AVAILABLE' ? 'AVAILABLE' : 'ASSIGNED'),
                      isReserved: status === 'RESERVED',
                    }
                  });
                } else {
                  // Create new IP
                  ipRef = await prisma.iPAddress.create({
                    data: {
                      address: ipAddress,
                      subnet,
                      gateway,
                      dns,
                      notes: ipNotes,
                      status: status === 'RESERVED' ? 'RESERVED' : (status === 'AVAILABLE' ? 'AVAILABLE' : 'ASSIGNED'),
                      isReserved: status === 'RESERVED',
                    }
                  });
                }

                // Handle Assignments
                if (status === 'ASSIGNED' && equipmentId) {
                  // Create/Ensured Assignment
                  const existingAssignment = await prisma.iPAssignment.findFirst({
                    where: {
                      ipAddressId: ipRef.id,
                      equipmentId: equipmentId,
                      isActive: true,
                    }
                  });

                  if (!existingAssignment) {
                    await prisma.iPAssignment.create({
                      data: {
                        ipAddressId: ipRef.id,
                        equipmentId: equipmentId,
                        userId: session.user?.id || "system",
                        isActive: true,
                        notes: ipNotes || `Imported with equipment ${item.name}`
                      }
                    });

                    // Audit Log for Assignment
                    await prisma.auditLog.create({
                      data: {
                        action: "IP_ASSIGNED",
                        entityType: "IP_ADDRESS",
                        entityId: ipRef.id,
                        userId: session.user?.id || "system",
                        ipAddressId: ipRef.id,
                        equipmentId: equipmentId,
                        details: {
                          ipAddress: ipAddress,
                          equipmentName: item.name,
                          imported: true
                        }
                      }
                    });
                  }
                } else {
                  // If status is AVAILABLE or RESERVED, we must deactivate any active assignments
                  // because this IP is explicitly being set to a non-assigned state.
                  await prisma.iPAssignment.updateMany({
                    where: {
                      ipAddressId: ipRef.id,
                      isActive: true
                    },
                    data: {
                      isActive: false,
                      releasedAt: new Date()
                    }
                  });
                }

              } catch (ipError) {
                const ipStr = typeof ipData === 'string' ? ipData : ipData?.address || 'unknown';
                results.errors.push(
                  `Failed to process IP ${ipStr}: ${ipError instanceof Error ? ipError.message : 'Unknown error'}`
                );
              }
            }
          }

          // Create audit log for Equipment Action (only if we touched equipment)
          if (isEquipment && equipmentId) {
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
          }

          results.successful++;
        } catch (error) {
          console.error(`Status 500 details: Failed to process item ${item.name}`, error);
          results.failed++;
          results.errors.push(
            `Failed to import ${item.name || 'item'}: ${error instanceof Error ? error.message : "Unknown error"}`
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

