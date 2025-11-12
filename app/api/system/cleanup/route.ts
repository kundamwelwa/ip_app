import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    console.log("\n" + "=".repeat(80));
    console.log("🧹 DATABASE CLEANUP - REMOVING DUPLICATE IP RECORDS");
    console.log("=".repeat(80) + "\n");

    // Get all IP addresses
    const allIPs = await prisma.iPAddress.findMany({
      include: {
        assignments: {
          include: {
            equipment: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Oldest first
      }
    });

    // Group by address to find duplicates
    const ipsByAddress = new Map<string, typeof allIPs>();
    
    allIPs.forEach(ip => {
      if (!ipsByAddress.has(ip.address)) {
        ipsByAddress.set(ip.address, []);
      }
      ipsByAddress.get(ip.address)!.push(ip);
    });

    const duplicates = Array.from(ipsByAddress.entries()).filter(([_, ips]) => ips.length > 1);

    if (duplicates.length === 0) {
      console.log("✅ No duplicate IP records found\n");
      return NextResponse.json({
        message: "No duplicate IP records to clean up",
        removed: 0
      });
    }

    console.log(`Found ${duplicates.length} IP address(es) with duplicate records\n`);

    const cleanupResults = [];
    let totalRemoved = 0;

    for (const [address, records] of duplicates) {
      console.log(`\n📍 Processing IP: ${address} (${records.length} records)`);
      
      // Keep the OLDEST record (first created) as it's likely the original
      const recordToKeep = records[0];
      const recordsToRemove = records.slice(1);

      console.log(`   ✅ Keeping: Record ID ${recordToKeep.id} (Created: ${recordToKeep.createdAt.toISOString()})`);
      console.log(`      - Has ${recordToKeep.assignments.length} assignment(s)`);

      // Move all assignments from duplicate records to the one we're keeping
      for (const duplicateRecord of recordsToRemove) {
        console.log(`   🗑️  Removing: Record ID ${duplicateRecord.id} (Created: ${duplicateRecord.createdAt.toISOString()})`);
        console.log(`      - Has ${duplicateRecord.assignments.length} assignment(s)`);

        // Move assignments to the kept record
        if (duplicateRecord.assignments.length > 0) {
          console.log(`      - Moving ${duplicateRecord.assignments.length} assignment(s) to kept record`);
          
          for (const assignment of duplicateRecord.assignments) {
            // Check if an assignment already exists for this equipment
            const existingAssignment = await prisma.iPAssignment.findFirst({
              where: {
                ipAddressId: recordToKeep.id,
                equipmentId: assignment.equipmentId,
                isActive: true
              }
            });

            if (existingAssignment) {
              console.log(`      - Skipping assignment for equipment ${assignment.equipment?.name} (already exists)`);
              // Deactivate the duplicate assignment
              await prisma.iPAssignment.update({
                where: { id: assignment.id },
                data: { isActive: false }
              });
            } else {
              // Move the assignment to the kept record
              await prisma.iPAssignment.update({
                where: { id: assignment.id },
                data: { ipAddressId: recordToKeep.id }
              });
              console.log(`      - Moved assignment for equipment ${assignment.equipment?.name}`);
            }
          }
        }

        // Delete the duplicate IP record
        try {
          await prisma.iPAddress.delete({
            where: { id: duplicateRecord.id }
          });
          console.log(`      ✅ Deleted duplicate record`);
          totalRemoved++;
        } catch (error) {
          console.error(`      ❌ Failed to delete record: ${error}`);
        }
      }

      cleanupResults.push({
        address,
        keptRecordId: recordToKeep.id,
        removedCount: recordsToRemove.length,
        removedRecordIds: recordsToRemove.map(r => r.id)
      });
    }

    console.log(`\n✅ Cleanup complete! Removed ${totalRemoved} duplicate IP records\n`);
    console.log("=".repeat(80) + "\n");

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "SYSTEM_CLEANUP",
        entityType: "SYSTEM",
        entityId: "cleanup",
        userId: session.user.id,
        details: {
          action: "remove_duplicate_ip_records",
          removedCount: totalRemoved,
          cleanupResults
        }
      }
    });

    return NextResponse.json({
      message: `Successfully cleaned up ${totalRemoved} duplicate IP record(s)`,
      removed: totalRemoved,
      details: cleanupResults
    });

  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json(
      { error: "Failed to cleanup duplicate records" },
      { status: 500 }
    );
  }
}

