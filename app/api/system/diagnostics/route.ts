import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("\n" + "=".repeat(80));
    console.log("🔍 SYSTEM DIAGNOSTICS - DATABASE STATE CHECK");
    console.log("=".repeat(80) + "\n");

    // Get all IP addresses
    const allIPs = await prisma.iPAddress.findMany({
      select: {
        id: true,
        address: true,
        status: true,
        subnet: true,
        createdAt: true
      },
      orderBy: {
        address: 'asc'
      }
    });

    console.log(`📊 Total IP Addresses in database: ${allIPs.length}`);
    console.log("\n📋 All IP Addresses:");
    allIPs.forEach((ip, index) => {
      console.log(`   ${index + 1}. ${ip.address} (Status: ${ip.status}, ID: ${ip.id})`);
      console.log(`      Created: ${ip.createdAt.toISOString()}`);
    });
    
    // Check for duplicate IP addresses (same address, different IDs)
    const addressCounts = new Map<string, number>();
    const duplicateAddresses: string[] = [];
    
    allIPs.forEach(ip => {
      const count = addressCounts.get(ip.address) || 0;
      addressCounts.set(ip.address, count + 1);
      if (count === 1) {
        duplicateAddresses.push(ip.address);
      }
    });
    
    if (duplicateAddresses.length > 0) {
      console.log(`\n🚨 DUPLICATE IP ADDRESS RECORDS DETECTED!`);
      console.log(`   Found ${duplicateAddresses.length} IP address(es) with multiple records:`);
      duplicateAddresses.forEach(addr => {
        const records = allIPs.filter(ip => ip.address === addr);
        console.log(`\n   IP: ${addr} (${records.length} records)`);
        records.forEach((record, idx) => {
          console.log(`      Record ${idx + 1}: ID=${record.id}, Status=${record.status}, Created=${record.createdAt.toISOString()}`);
        });
      });
      console.log("");
    } else {
      console.log("\n✅ No duplicate IP address records found\n");
    }
    
    // Get all assignments
    const allAssignments = await prisma.iPAssignment.findMany({
      include: {
        ipAddress: {
          select: {
            address: true,
            status: true
          }
        },
        equipment: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        assignedAt: 'asc'
      }
    });

    console.log(`📊 Total IP Assignments: ${allAssignments.length}`);
    console.log(`   - Active: ${allAssignments.filter(a => a.isActive).length}`);
    console.log(`   - Inactive: ${allAssignments.filter(a => !a.isActive).length}\n`);

    // Group assignments by IP address
    const assignmentsByIP = new Map<string, typeof allAssignments>();
    
    allAssignments.forEach(assignment => {
      if (assignment.isActive) {
        const ipAddress = assignment.ipAddress.address;
        if (!assignmentsByIP.has(ipAddress)) {
          assignmentsByIP.set(ipAddress, []);
        }
        assignmentsByIP.get(ipAddress)!.push(assignment);
      }
    });

    // Find conflicts
    const conflicts: any[] = [];
    assignmentsByIP.forEach((assignments, ipAddress) => {
      if (assignments.length > 1) {
        conflicts.push({
          ipAddress,
          assignmentCount: assignments.length,
          assignments: assignments.map(a => ({
            id: a.id,
            equipmentId: a.equipmentId,
            equipmentName: a.equipment?.name || 'Unknown',
            equipmentType: a.equipment?.type,
            isActive: a.isActive,
            assignedAt: a.assignedAt
          }))
        });

        console.log(`🚨 CONFLICT DETECTED: ${ipAddress}`);
        console.log(`   Has ${assignments.length} ACTIVE assignments:`);
        assignments.forEach((a, index) => {
          console.log(`   ${index + 1}. Equipment: ${a.equipment?.name} (${a.equipment?.type})`);
          console.log(`      Equipment ID: ${a.equipmentId}`);
          console.log(`      Assignment ID: ${a.id}`);
          console.log(`      Active: ${a.isActive}`);
          console.log(`      Assigned At: ${a.assignedAt.toISOString()}`);
        });
        console.log("");
      }
    });

    if (conflicts.length === 0) {
      console.log("✅ No conflicts detected - all IPs have at most one active assignment\n");
    } else {
      console.log(`🚨 TOTAL CONFLICTS: ${conflicts.length}\n`);
    }

    // Check for IPs with status mismatch
    console.log("🔍 Checking for status mismatches...\n");
    const statusMismatches: any[] = [];
    
    for (const ip of allIPs) {
      const activeAssignments = allAssignments.filter(
        a => a.ipAddress.address === ip.address && a.isActive
      );
      
      if (activeAssignments.length > 0 && ip.status !== "ASSIGNED") {
        statusMismatches.push({
          address: ip.address,
          currentStatus: ip.status,
          expectedStatus: "ASSIGNED",
          activeAssignments: activeAssignments.length
        });
        console.log(`⚠️  Status Mismatch: ${ip.address}`);
        console.log(`   Current Status: ${ip.status}`);
        console.log(`   Expected Status: ASSIGNED (has ${activeAssignments.length} active assignment(s))`);
        console.log("");
      }
      
      if (activeAssignments.length === 0 && ip.status === "ASSIGNED") {
        statusMismatches.push({
          address: ip.address,
          currentStatus: ip.status,
          expectedStatus: "AVAILABLE",
          activeAssignments: 0
        });
        console.log(`⚠️  Status Mismatch: ${ip.address}`);
        console.log(`   Current Status: ${ip.status}`);
        console.log(`   Expected Status: AVAILABLE (has 0 active assignments)`);
        console.log("");
      }
    }

    if (statusMismatches.length === 0) {
      console.log("✅ No status mismatches detected\n");
    }

    console.log("=".repeat(80) + "\n");

    // Prepare duplicate IP records for response
    const duplicateIPRecords = duplicateAddresses.map(addr => {
      const records = allIPs.filter(ip => ip.address === addr);
      return {
        address: addr,
        recordCount: records.length,
        records: records.map(r => ({
          id: r.id,
          status: r.status,
          createdAt: r.createdAt
        }))
      };
    });

    return NextResponse.json({
      summary: {
        totalIPs: allIPs.length,
        totalAssignments: allAssignments.length,
        activeAssignments: allAssignments.filter(a => a.isActive).length,
        conflicts: conflicts.length,
        statusMismatches: statusMismatches.length,
        duplicateIPRecords: duplicateAddresses.length
      },
      allIPs: allIPs.map(ip => ({
        id: ip.id,
        address: ip.address,
        status: ip.status,
        createdAt: ip.createdAt
      })),
      duplicateIPRecords,
      conflicts,
      statusMismatches,
      message: duplicateAddresses.length > 0
        ? `🚨 CRITICAL: ${duplicateAddresses.length} duplicate IP record(s) detected! This violates database constraints.`
        : conflicts.length > 0 
        ? `⚠️ ${conflicts.length} IP conflict(s) detected!` 
        : "✅ Database integrity verified"
    });

  } catch (error) {
    console.error("Error running diagnostics:", error);
    return NextResponse.json(
      { error: "Failed to run diagnostics" },
      { status: 500 }
    );
  }
}

