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

    // Find IP addresses with multiple active assignments (conflicts)
    const allAssignments = await prisma.iPAssignment.findMany({
      where: { isActive: true },
      include: {
        ipAddress: true,
        equipment: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            location: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Group assignments by IP address
    const ipGroups = new Map<string, typeof allAssignments>();
    
    allAssignments.forEach((assignment) => {
      const ipAddress = assignment.ipAddress.address;
      if (!ipGroups.has(ipAddress)) {
        ipGroups.set(ipAddress, []);
      }
      ipGroups.get(ipAddress)!.push(assignment);
    });

    // Find conflicts (IP addresses with multiple active assignments)
    const conflicts = Array.from(ipGroups.entries())
      .filter(([_, assignments]) => assignments.length > 1)
      .map(([ipAddress, assignments]) => ({
        ipAddress,
        conflictCount: assignments.length,
        assignments: assignments.map((a) => ({
          id: a.id,
          equipmentId: a.equipmentId,
          equipmentName: a.equipment?.name || "Unknown",
          equipmentType: a.equipment?.type || "UNKNOWN",
          equipmentStatus: a.equipment?.status || "UNKNOWN",
          location: a.equipment?.location || "Unknown",
          assignedAt: a.assignedAt,
          assignedBy: `${a.user.firstName} ${a.user.lastName}`,
          notes: a.notes,
        })),
      }));

    // Find duplicate equipment assignments (equipment with multiple IPs)
    const equipmentGroups = new Map<string, typeof allAssignments>();
    
    allAssignments.forEach((assignment) => {
      const equipmentId = assignment.equipmentId;
      if (equipmentId) {
        if (!equipmentGroups.has(equipmentId)) {
          equipmentGroups.set(equipmentId, []);
        }
        equipmentGroups.get(equipmentId)!.push(assignment);
      }
    });

    const duplicateEquipment = Array.from(equipmentGroups.entries())
      .filter(([_, assignments]) => assignments.length > 1)
      .map(([equipmentId, assignments]) => ({
        equipmentId,
        equipmentName: assignments[0]?.equipment?.name || "Unknown",
        equipmentType: assignments[0]?.equipment?.type || "UNKNOWN",
        assignmentCount: assignments.length,
        ipAddresses: assignments.map((a) => ({
          address: a.ipAddress.address,
          assignedAt: a.assignedAt,
          notes: a.notes,
        })),
      }));

    // Find IPs marked as ASSIGNED but with no active assignments
    const assignedIPs = await prisma.iPAddress.findMany({
      where: {
        status: "ASSIGNED",
      },
      include: {
        assignments: {
          where: { isActive: true },
        },
      },
    });

    const orphanedIPs = assignedIPs
      .filter((ip) => ip.assignments.length === 0)
      .map((ip) => ({
        address: ip.address,
        subnet: ip.subnet,
        status: ip.status,
        updatedAt: ip.updatedAt,
      }));

    // Summary
    const summary = {
      totalConflicts: conflicts.length,
      totalDuplicateEquipment: duplicateEquipment.length,
      totalOrphanedIPs: orphanedIPs.length,
      totalIssues: conflicts.length + duplicateEquipment.length + orphanedIPs.length,
    };

    return NextResponse.json({
      summary,
      conflicts,
      duplicateEquipment,
      orphanedIPs,
    });
  } catch (error) {
    console.error("Error detecting IP conflicts:", error);
    return NextResponse.json(
      { error: "Failed to detect IP conflicts" },
      { status: 500 }
    );
  }
}

// Resolve a specific IP conflict
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ipAddress, keepAssignmentId, action } = body;

    if (action === "resolve_conflict") {
      if (!ipAddress || !keepAssignmentId) {
        return NextResponse.json(
          { error: "IP address and assignment ID to keep are required" },
          { status: 400 }
        );
      }

      // Find all active assignments for this IP
      const assignments = await prisma.iPAssignment.findMany({
        where: {
          ipAddress: {
            address: ipAddress,
          },
          isActive: true,
        },
      });

      if (assignments.length <= 1) {
        return NextResponse.json(
          { error: "No conflict found for this IP address" },
          { status: 400 }
        );
      }

      // Deactivate all assignments except the one to keep
      const assignmentsToDeactivate = assignments.filter(
        (a) => a.id !== keepAssignmentId
      );

      await Promise.all(
        assignmentsToDeactivate.map((assignment) =>
          prisma.iPAssignment.update({
            where: { id: assignment.id },
            data: {
              isActive: false,
              releasedAt: new Date(),
            },
          })
        )
      );

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "IP_CONFLICT_RESOLVED",
          entityType: "IP_ADDRESS",
          entityId: assignments[0].ipAddressId,
          userId: session.user?.id || "system",
          ipAddressId: assignments[0].ipAddressId,
          details: {
            ipAddress,
            resolvedBy: session.user?.email,
            keptAssignmentId: keepAssignmentId,
            removedAssignments: assignmentsToDeactivate.map((a) => a.id),
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "IP conflict resolved successfully",
        removedCount: assignmentsToDeactivate.length,
      });
    }

    if (action === "fix_orphaned") {
      if (!ipAddress) {
        return NextResponse.json(
          { error: "IP address is required" },
          { status: 400 }
        );
      }

      // Find the IP and update its status to AVAILABLE
      const ip = await prisma.iPAddress.findUnique({
        where: { address: ipAddress },
        include: {
          assignments: {
            where: { isActive: true },
          },
        },
      });

      if (!ip) {
        return NextResponse.json(
          { error: "IP address not found" },
          { status: 404 }
        );
      }

      if (ip.assignments.length > 0) {
        return NextResponse.json(
          { error: "IP address has active assignments" },
          { status: 400 }
        );
      }

      // Update status to AVAILABLE
      await prisma.iPAddress.update({
        where: { address: ipAddress },
        data: { status: "AVAILABLE" },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "IP_ORPHANED_FIXED",
          entityType: "IP_ADDRESS",
          entityId: ip.id,
          userId: session.user?.id || "system",
          ipAddressId: ip.id,
          details: {
            ipAddress,
            fixedBy: session.user?.email,
            previousStatus: "ASSIGNED",
            newStatus: "AVAILABLE",
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Orphaned IP address fixed successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error resolving IP conflict:", error);
    return NextResponse.json(
      { error: "Failed to resolve IP conflict" },
      { status: 500 }
    );
  }
}

