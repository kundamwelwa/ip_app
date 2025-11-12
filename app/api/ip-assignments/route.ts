import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as alertService from "@/lib/alert-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ipAddress, equipmentId, notes } = body;

    console.log("\n" + "=".repeat(80));
    console.log("🔍 IP ASSIGNMENT REQUEST");
    console.log("=".repeat(80));
    console.log(`📍 IP Address: ${ipAddress}`);
    console.log(`📦 Equipment ID: ${equipmentId}`);
    console.log(`👤 User: ${session.user.email}`);
    console.log("=".repeat(80) + "\n");

    // Validate required fields
    if (!ipAddress || !equipmentId) {
      return NextResponse.json(
        { error: "IP address and equipment ID are required" },
        { status: 400 }
      );
    }

    // CRITICAL: Multi-layer check to prevent duplicate IP assignments
    
    console.log("🔍 Layer 1: Checking for existing active assignments...");
    
    // Layer 1: Check active assignments by IP address string
    const existingAssignment = await prisma.iPAssignment.findFirst({
      where: {
        ipAddress: {
          address: ipAddress
        },
        isActive: true
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            type: true,
            location: true
          }
        },
        ipAddress: {
          select: {
            address: true,
            status: true
          }
        }
      }
    });

    console.log(`   Result: ${existingAssignment ? 'FOUND existing assignment' : 'No existing assignment'}`);
    if (existingAssignment) {
      console.log(`   - Assigned to: ${existingAssignment.equipment?.name} (ID: ${existingAssignment.equipment?.id})`);
      console.log(`   - Assignment ID: ${existingAssignment.id}`);
      console.log(`   - Assigned At: ${existingAssignment.assignedAt.toISOString()}`);
    }

    if (existingAssignment) {
      console.error(`\n🚨 CRITICAL: IP Assignment Conflict Detected!`);
      console.error(`IP ${ipAddress} is already assigned to ${existingAssignment.equipment?.name} (ID: ${existingAssignment.equipment?.id})`);
      console.error(`Attempting to assign to equipment ID: ${equipmentId}`);
      console.error(`BLOCKING THIS ASSIGNMENT!\n`);
      
      return NextResponse.json(
        { 
          error: `ASSIGNMENT BLOCKED: IP address ${ipAddress} is already assigned to "${existingAssignment.equipment?.name}" at location "${existingAssignment.equipment?.location || 'Unknown'}". One IP address cannot be assigned to multiple equipment. Please unassign it first or use a different IP address.`,
          conflictDetails: {
            currentEquipment: existingAssignment.equipment,
            assignedAt: existingAssignment.assignedAt,
            assignmentId: existingAssignment.id
          }
        },
        { status: 409 } // 409 Conflict
      );
    }
    
    console.log("✅ Layer 1 passed - no existing assignment found\n");

    // Layer 2: Check if the IP record exists and has status ASSIGNED
    const ipRecord = await prisma.iPAddress.findUnique({
      where: { address: ipAddress },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            equipment: {
              select: {
                name: true,
                location: true
              }
            }
          }
        }
      }
    });

    if (ipRecord && ipRecord.status === "ASSIGNED" && ipRecord.assignments.length > 0) {
      const activeAssignment = ipRecord.assignments[0];
      console.error(`🚨 CRITICAL: IP Status Check Failed!`);
      console.error(`IP ${ipAddress} has status ASSIGNED with ${ipRecord.assignments.length} active assignment(s)`);
      
      return NextResponse.json(
        { 
          error: `ASSIGNMENT BLOCKED: IP address ${ipAddress} is currently assigned to "${activeAssignment.equipment?.name}". Cannot assign the same IP to multiple equipment.`,
          conflictDetails: {
            currentEquipment: activeAssignment.equipment,
            activeAssignments: ipRecord.assignments.length
          }
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Check if equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    // Use ipRecord from Layer 2 check or create if it doesn't exist
    let ipAddressRecord;

    if (ipRecord) {
      ipAddressRecord = ipRecord;
    } else {
      // Create new IP address record if it doesn't exist
      const newRecord = await prisma.iPAddress.create({
        data: {
          address: ipAddress,
          subnet: "192.168.1.0/24", // Default subnet, can be made configurable
          gateway: "192.168.1.1", // Default gateway, can be made configurable
          dns: "8.8.8.8,8.8.4.4", // Default DNS, can be made configurable
          status: "AVAILABLE"
        }
      });

      // Fetch with assignments to match the type
      ipAddressRecord = await prisma.iPAddress.findUnique({
        where: { id: newRecord.id },
        include: {
          assignments: {
            where: { isActive: true },
            include: {
              equipment: {
                select: {
                  name: true,
                  location: true
                }
              }
            }
          }
        }
      });
    }

    // Ensure ipAddressRecord exists at this point
    if (!ipAddressRecord) {
      return NextResponse.json(
        { error: "Failed to create or retrieve IP address record" },
        { status: 500 }
      );
    }

    // Create IP assignment
    const assignment = await prisma.iPAssignment.create({
      data: {
        equipmentId,
        ipAddressId: ipAddressRecord.id,
        userId: session.user?.id || "system",
        isActive: true,
        notes: notes || null
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            location: true,
            operator: true
          }
        },
        ipAddress: {
          select: {
            address: true,
            subnet: true,
            gateway: true,
            dns: true
          }
        }
      }
    });

    // Update IP address status to ASSIGNED
    await prisma.iPAddress.update({
      where: { id: ipAddressRecord.id },
      data: { 
        status: "ASSIGNED"
      }
    });

    // Update equipment status to ONLINE if it was OFFLINE
    if (equipment.status === "OFFLINE") {
      await prisma.equipment.update({
        where: { id: equipmentId },
        data: { 
          status: "ONLINE",
          lastSeen: new Date()
        }
      });
    }

    // Create audit log for the assignment
    await prisma.auditLog.create({
      data: {
        action: "IP_ASSIGNED",
        entityType: "IP_ADDRESS",
        entityId: ipAddressRecord.id,
        userId: session.user?.id || "system",
        ipAddressId: ipAddressRecord.id,
        equipmentId: equipmentId,
        details: {
          ipAddress: ipAddress,
          equipmentName: equipment.name,
          equipmentType: equipment.type,
          notes: notes
        }
      }
    });

    // Create alert for IP assignment
    await alertService.alertIPAssigned(
      ipAddressRecord.id,
      ipAddress,
      equipmentId,
      equipment.name,
      session.user?.id || "system"
    );

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        equipment: assignment.equipment,
        ipAddress: assignment.ipAddress,
        assignedAt: assignment.assignedAt,
        notes: assignment.notes
      }
    });

  } catch (error) {
    console.error("Error creating IP assignment:", error);
    return NextResponse.json(
      { error: "Failed to create IP assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ipAddress = searchParams.get("ip");
    const assignmentId = searchParams.get("assignmentId");
    const ipAddressId = searchParams.get("ipAddressId");
    const equipmentId = searchParams.get("equipmentId");

    console.log("\n" + "=".repeat(80));
    console.log("🗑️  DELETE IP ASSIGNMENT REQUEST");
    console.log("=".repeat(80));
    console.log(`📍 Parameters:`);
    console.log(`   - ip: ${ipAddress}`);
    console.log(`   - assignmentId: ${assignmentId}`);
    console.log(`   - ipAddressId: ${ipAddressId}`);
    console.log(`   - equipmentId: ${equipmentId}`);
    console.log("=".repeat(80) + "\n");

    // Build where clause based on provided parameters
    let whereClause: any = { isActive: true };

    if (assignmentId) {
      // Delete by assignment ID (most direct)
      whereClause = { id: assignmentId, isActive: true };
    } else if (ipAddressId && equipmentId) {
      // Delete by IP ID + Equipment ID combination
      whereClause = {
        ipAddressId,
        equipmentId,
        isActive: true
      };
    } else if (ipAddress) {
      // Delete by IP address string
      whereClause = {
        ipAddress: {
          address: ipAddress
        },
        isActive: true
      };
    } else {
      console.error("❌ No valid parameters provided\n");
      return NextResponse.json(
        { error: "Either assignmentId, (ipAddressId + equipmentId), or ip address is required" },
        { status: 400 }
      );
    }

    // Find the assignment
    console.log("🔍 Searching for assignment with where clause:", JSON.stringify(whereClause, null, 2));
    
    const assignment = await prisma.iPAssignment.findFirst({
      where: whereClause,
      include: {
        equipment: true,
        ipAddress: true
      }
    });

    if (!assignment) {
      console.error("❌ No active assignment found\n");
      return NextResponse.json(
        { error: "No active assignment found with the provided parameters" },
        { status: 404 }
      );
    }

    console.log(`✅ Found assignment:`);
    console.log(`   - Assignment ID: ${assignment.id}`);
    console.log(`   - IP Address: ${assignment.ipAddress.address}`);
    console.log(`   - Equipment: ${assignment.equipment?.name || 'Unknown'}`);
    console.log(`   - Equipment ID: ${assignment.equipmentId}`);
    console.log("");

    // Deactivate the assignment
    console.log("🔄 Deactivating assignment...");
    await prisma.iPAssignment.update({
      where: { id: assignment.id },
      data: { 
        isActive: false,
        releasedAt: new Date()
      }
    });
    console.log("✅ Assignment deactivated");

    // Check if there are any OTHER active assignments for this IP
    const otherActiveAssignments = await prisma.iPAssignment.findMany({
      where: {
        ipAddressId: assignment.ipAddressId,
        isActive: true,
        id: { not: assignment.id } // Exclude the one we just deactivated (in case of race conditions)
      }
    });

    console.log(`🔍 Checking for other active assignments: ${otherActiveAssignments.length} found`);

    // Only mark IP as AVAILABLE if there are NO other active assignments
    if (otherActiveAssignments.length === 0) {
      console.log("✅ No other assignments - marking IP as AVAILABLE");
      await prisma.iPAddress.update({
        where: { id: assignment.ipAddressId },
        data: { 
          status: "AVAILABLE"
        }
      });
    } else {
      console.log(`⚠️  IP still has ${otherActiveAssignments.length} other active assignment(s) - keeping status as ASSIGNED`);
      otherActiveAssignments.forEach((a, idx) => {
        console.log(`   ${idx + 1}. Equipment ID: ${a.equipmentId}, Assignment ID: ${a.id}`);
      });
    }

    // Create audit log for the unassignment
    await prisma.auditLog.create({
      data: {
        action: "IP_UNASSIGNED",
        entityType: "IP_ADDRESS",
        entityId: assignment.ipAddressId,
        userId: session.user?.id || "system",
        ipAddressId: assignment.ipAddressId,
        equipmentId: assignment.equipmentId,
        details: {
          ipAddress: assignment.ipAddress.address,
          equipmentName: assignment.equipment?.name || "Unknown",
          equipmentType: assignment.equipment?.type || "Unknown",
          releasedAt: new Date()
        }
      }
    });

    // Create alert for IP unassignment
    if (assignment.equipment && assignment.equipmentId) {
      await alertService.alertIPUnassigned(
        assignment.ipAddressId,
        assignment.ipAddress.address,
        assignment.equipmentId,
        assignment.equipment.name,
        session.user?.id || "system"
      );
    }

    console.log("✅ IP assignment removed successfully");
    console.log("=".repeat(80) + "\n");

    return NextResponse.json({
      success: true,
      message: "IP assignment removed successfully",
      unassignedIP: assignment.ipAddress.address,
      equipment: assignment.equipment?.name
    });

  } catch (error) {
    console.error("Error removing IP assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove IP assignment" },
      { status: 500 }
    );
  }
}