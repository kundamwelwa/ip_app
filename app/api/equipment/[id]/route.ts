import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params (Next.js 15 requirement)
    const { id } = await params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params (Next.js 15 requirement)
    const { id } = await params;

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
      where: { id },
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
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Check if equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Delete in a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // First, get all IP addresses assigned to this equipment BEFORE deleting assignments
      const ipAssignments = await tx.iPAssignment.findMany({
        where: {
          equipmentId: id,
        },
        select: {
          ipAddressId: true,
        },
      });

      const ipAddressIds = ipAssignments.map((assignment) => assignment.ipAddressId);

      // Log the action BEFORE deleting (so equipment still exists)
      await tx.auditLog.create({
        data: {
          action: "EQUIPMENT_DELETED",
          entityType: "EQUIPMENT",
          entityId: id,
          userId: session.user.id,
          equipmentId: id,
          details: {
            name: equipment.name,
            type: equipment.type,
          },
        },
      });

      // Delete all IP assignments (both active and inactive)
      await tx.iPAssignment.deleteMany({
        where: {
          equipmentId: id,
        },
      });

      // Update IP address statuses back to AVAILABLE if they have no other active assignments
      if (ipAddressIds.length > 0) {
        for (const ipAddressId of ipAddressIds) {
          // Check if this IP address has any other active assignments
          const otherAssignments = await tx.iPAssignment.findFirst({
            where: {
              ipAddressId: ipAddressId,
              isActive: true,
            },
          });

          // If no other active assignments, set status back to AVAILABLE
          if (!otherAssignments) {
            await tx.iPAddress.update({
              where: { id: ipAddressId },
              data: { status: "AVAILABLE" },
            });
          }
        }
      }

      // Update alerts to remove equipment reference (instead of deleting them)
      try {
        await tx.alert.updateMany({
          where: {
            equipmentId: id,
          },
          data: {
            equipmentId: null,
          },
        });
      } catch (alertError) {
        // Log but don't fail if alerts can't be updated
        console.warn("Could not update alerts for equipment:", alertError);
      }

      // Finally delete the equipment
      const deletedEquipment = await tx.equipment.delete({
        where: { id },
      });
      
      console.log(`Successfully deleted equipment: ${deletedEquipment.id} - ${deletedEquipment.name}`);
    });

    // Verify deletion
    const verifyDeleted = await prisma.equipment.findUnique({
      where: { id },
    });
    
    if (verifyDeleted) {
      console.error(`WARNING: Equipment ${id} still exists after deletion!`);
      return NextResponse.json(
        { error: "Equipment deletion may have failed. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Equipment deleted successfully" });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Provide more detailed error information
    let errorMessage = "Failed to delete equipment";
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for Prisma errors
      const prismaError = error as any;
      if (prismaError.code) {
        if (prismaError.code === 'P2003') {
          errorMessage = "Cannot delete equipment: it is referenced by other records";
        } else if (prismaError.code === 'P2025') {
          errorMessage = "Equipment not found";
        } else if (prismaError.code === 'P2014') {
          errorMessage = "Cannot delete equipment: required relation violation";
        } else {
          errorMessage = `Database error (${prismaError.code}): ${prismaError.meta?.target || prismaError.message || errorMessage}`;
        }
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
