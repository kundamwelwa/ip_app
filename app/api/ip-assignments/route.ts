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

    // Validate required fields
    if (!ipAddress || !equipmentId) {
      return NextResponse.json(
        { error: "IP address and equipment ID are required" },
        { status: 400 }
      );
    }

    // Check if IP address is already assigned
    const existingAssignment = await prisma.iPAssignment.findFirst({
      where: {
        ipAddress: {
          address: ipAddress
        },
        isActive: true
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "IP address is already assigned to equipment" },
        { status: 400 }
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

    // Create IP address if it doesn't exist
    let ipAddressRecord = await prisma.iPAddress.findUnique({
      where: { address: ipAddress }
    });

    if (!ipAddressRecord) {
      ipAddressRecord = await prisma.iPAddress.create({
        data: {
          address: ipAddress,
          subnet: "192.168.1.0/24", // Default subnet, can be made configurable
          gateway: "192.168.1.1", // Default gateway, can be made configurable
          dns: "8.8.8.8,8.8.4.4" // Default DNS, can be made configurable
        }
      });
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

    if (!ipAddress) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      );
    }

    // Find and deactivate the assignment
    const assignment = await prisma.iPAssignment.findFirst({
      where: {
        ipAddress: {
          address: ipAddress
        },
        isActive: true
      },
      include: {
        equipment: true,
        ipAddress: true
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "No active assignment found for this IP address" },
        { status: 404 }
      );
    }

    // Deactivate the assignment
    await prisma.iPAssignment.update({
      where: { id: assignment.id },
      data: { 
        isActive: false,
        releasedAt: new Date()
      }
    });

    // Update IP address status back to AVAILABLE
    await prisma.iPAddress.update({
      where: { id: assignment.ipAddressId },
      data: { 
        status: "AVAILABLE"
      }
    });

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

    return NextResponse.json({
      success: true,
      message: "IP assignment removed successfully"
    });

  } catch (error) {
    console.error("Error removing IP assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove IP assignment" },
      { status: 500 }
    );
  }
}