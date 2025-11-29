import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    for (const item of equipment) {
      try {
        // Validate required fields
        if (!item.name || !item.type) {
          results.failed++;
          results.errors.push(`Missing required fields for equipment: ${item.name || "unknown"}`);
          continue;
        }

        // Check for duplicate MAC address
        if (item.macAddress) {
          const existing = await prisma.equipment.findUnique({
            where: { macAddress: item.macAddress },
          });

          if (existing) {
            results.failed++;
            results.errors.push(`Equipment with MAC address ${item.macAddress} already exists`);
            continue;
          }
        }

        // Create equipment
        const newEquipment = await prisma.equipment.create({
          data: {
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
          },
        });

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
              let ipRecord = await prisma.iPAddress.findUnique({
                where: { address: ipAddress },
                include: {
                  assignments: {
                    where: { isActive: true },
                    include: { equipment: { select: { name: true } } }
                  }
                }
              });

              if (ipRecord) {
                // IP exists - check if it's already assigned
                if (ipRecord.status === 'ASSIGNED' && ipRecord.assignments.length > 0) {
                  const assignedTo = ipRecord.assignments[0].equipment?.name || 'unknown';
                  results.errors.push(
                    `Equipment ${item.name}: IP ${ipAddress} is already assigned to "${assignedTo}"`
                  );
                  continue;
                }

                // Update existing IP record
                ipRecord = await prisma.iPAddress.update({
                  where: { id: ipRecord.id },
                  data: {
                    status: 'ASSIGNED',
                    subnet: subnet,
                    gateway: gateway,
                    dns: dns,
                    notes: ipNotes || ipRecord.notes,
                  }
                });
              } else {
                // Create new IP address record
                ipRecord = await prisma.iPAddress.create({
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
              }

              // Create IP assignment linking equipment to IP
              await prisma.iPAssignment.create({
                data: {
                  ipAddressId: ipRecord.id,
                  equipmentId: newEquipment.id,
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
                  entityId: ipRecord.id,
                  userId: session.user?.id || "system",
                  ipAddressId: ipRecord.id,
                  equipmentId: newEquipment.id,
                  details: {
                    ipAddress: ipAddress,
                    equipmentName: item.name,
                    imported: true
                  }
                }
              });
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
            action: "EQUIPMENT_IMPORTED",
            entityType: "EQUIPMENT",
            entityId: newEquipment.id,
            userId: session.user?.id || "system",
            equipmentId: newEquipment.id,
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
        results.failed++;
        results.errors.push(
          `Failed to import equipment ${item.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
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
      { error: "Failed to import equipment" },
      { status: 500 }
    );
  }
}

