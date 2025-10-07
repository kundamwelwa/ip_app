import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: params.id },
      include: {
        ipAssignments: {
          where: { isActive: true },
          include: {
            ipAddress: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        alerts: {
          where: { isResolved: false },
          orderBy: { createdAt: "desc" },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      model,
      manufacturer,
      macAddress,
      serialNumber,
      location,
      operator,
      description,
      notes,
      status,
      nodeId,
      meshStrength,
    } = body;

    // Convert type to uppercase to match enum
    const equipmentType = type?.toUpperCase();

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: params.id },
    });

    if (!existingEquipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Check for duplicate MAC address if provided and changed
    if (macAddress && macAddress !== existingEquipment.macAddress) {
      const duplicate = await prisma.equipment.findUnique({
        where: { macAddress },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Equipment with this MAC address already exists" },
          { status: 400 }
        );
      }
    }

    // Update equipment
    const equipment = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        name,
        type: equipmentType,
        model,
        manufacturer,
        macAddress,
        serialNumber,
        location,
        operator,
        description,
        notes,
        status,
        nodeId,
        meshStrength,
        lastSeen: status === "ONLINE" ? new Date() : undefined,
      },
      include: {
        ipAssignments: {
          where: { isActive: true },
          include: {
            ipAddress: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "EQUIPMENT_UPDATED",
        entityType: "EQUIPMENT",
        entityId: equipment.id,
        userId: session.user.id,
        equipmentId: equipment.id,
        details: {
          changes: {
            name: equipment.name,
            type: equipment.type,
            status: equipment.status,
          },
        },
      },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json(
      { error: "Failed to update equipment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id: params.id },
      include: {
        ipAssignments: {
          where: { isActive: true },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Check if equipment has active IP assignments
    if (equipment.ipAssignments.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete equipment with active IP assignments" },
        { status: 400 }
      );
    }

    // Delete equipment
    await prisma.equipment.delete({
      where: { id: params.id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "EQUIPMENT_DELETED",
        entityType: "EQUIPMENT",
        entityId: params.id,
        userId: session.user.id,
        equipmentId: params.id,
        details: {
          name: equipment.name,
          type: equipment.type,
        },
      },
    });

    return NextResponse.json({ message: "Equipment deleted successfully" });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json(
      { error: "Failed to delete equipment" },
      { status: 500 }
    );
  }
}
