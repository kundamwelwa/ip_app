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

    // Find all IP addresses with multiple active assignments (conflicts)
    const conflicts = await prisma.iPAddress.findMany({
      where: {
        assignments: {
          some: {
            isActive: true
          }
        }
      },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                type: true,
                location: true
              }
            },
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            assignedAt: 'asc' // Oldest first
          }
        }
      }
    });

    // Filter to only those with more than one active assignment
    const actualConflicts = conflicts.filter(ip => ip.assignments.length > 1);

    const conflictDetails = actualConflicts.map(ip => ({
      ipAddress: ip.address,
      subnet: ip.subnet,
      conflictCount: ip.assignments.length,
      assignments: ip.assignments.map(assignment => ({
        id: assignment.id,
        equipmentId: assignment.equipment?.id,
        equipmentName: assignment.equipment?.name,
        equipmentType: assignment.equipment?.type,
        location: assignment.equipment?.location,
        assignedAt: assignment.assignedAt,
        assignedBy: assignment.user 
          ? `${assignment.user.firstName} ${assignment.user.lastName}`
          : "System"
      }))
    }));

    return NextResponse.json({
      conflicts: conflictDetails,
      total: conflictDetails.length,
      message: conflictDetails.length === 0 
        ? "No IP conflicts detected" 
        : `Found ${conflictDetails.length} IP address conflict(s)`
    });
  } catch (error) {
    console.error("Error checking for IP conflicts:", error);
    return NextResponse.json(
      { error: "Failed to check for IP conflicts" },
      { status: 500 }
    );
  }
}

// Resolve conflicts by keeping only the oldest assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const body = await request.json();
    const { autoResolve = false } = body;

    if (!autoResolve) {
      return NextResponse.json({
        message: "Set autoResolve: true to automatically resolve conflicts by keeping the oldest assignment per IP"
      });
    }

    // Find all IP addresses with multiple active assignments
    const conflicts = await prisma.iPAddress.findMany({
      where: {
        assignments: {
          some: {
            isActive: true
          }
        }
      },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            equipment: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            assignedAt: 'asc' // Oldest first
          }
        }
      }
    });

    const actualConflicts = conflicts.filter(ip => ip.assignments.length > 1);
    
    if (actualConflicts.length === 0) {
      return NextResponse.json({
        message: "No conflicts to resolve",
        resolved: 0
      });
    }

    let resolvedCount = 0;
    const resolutionDetails = [];

    for (const ip of actualConflicts) {
      const [keepAssignment, ...removeAssignments] = ip.assignments;

      // Deactivate all but the oldest assignment
      for (const assignment of removeAssignments) {
        await prisma.iPAssignment.update({
          where: { id: assignment.id },
          data: { 
            isActive: false,
            releasedAt: new Date()
          }
        });

        // Log the resolution
        await prisma.auditLog.create({
          data: {
            action: "IP_CONFLICT_RESOLVED",
            entityType: "IP_ADDRESS",
            entityId: ip.id,
            userId: session.user.id,
            ipAddressId: ip.id,
            equipmentId: assignment.equipmentId,
            details: {
              ipAddress: ip.address,
              removedFrom: assignment.equipment?.name,
              keptOn: keepAssignment.equipment?.name,
              reason: "Automatic conflict resolution - kept oldest assignment"
            }
          }
        });

        resolutionDetails.push({
          ipAddress: ip.address,
          removedFrom: assignment.equipment?.name,
          keptOn: keepAssignment.equipment?.name
        });

        resolvedCount++;
      }
    }

    return NextResponse.json({
      message: `Successfully resolved ${actualConflicts.length} IP conflict(s) affecting ${resolvedCount} duplicate assignment(s)`,
      resolvedConflicts: actualConflicts.length,
      deactivatedAssignments: resolvedCount,
      details: resolutionDetails
    });

  } catch (error) {
    console.error("Error resolving IP conflicts:", error);
    return NextResponse.json(
      { error: "Failed to resolve IP conflicts" },
      { status: 500 }
    );
  }
}
