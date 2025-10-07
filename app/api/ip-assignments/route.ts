import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        equipment: true
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