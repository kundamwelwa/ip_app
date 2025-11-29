import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { equipmentIds } = await request.json();

    if (!Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid equipment IDs" },
        { status: 400 }
      );
    }

    // First, verify which equipment exists
    const existingEquipment = await prisma.equipment.findMany({
      where: {
        id: { in: equipmentIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (existingEquipment.length === 0) {
      return NextResponse.json(
        { error: "No equipment found with the provided IDs" },
        { status: 404 }
      );
    }

    const existingIds = existingEquipment.map((eq) => eq.id);
    const missingIds = equipmentIds.filter((id) => !existingIds.includes(id));

    // Delete all equipment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, get all IP addresses assigned to these equipment BEFORE deleting assignments
      const ipAssignments = await tx.iPAssignment.findMany({
        where: {
          equipmentId: { in: existingIds },
        },
        select: {
          ipAddressId: true,
        },
      });

      const ipAddressIds = [...new Set(ipAssignments.map((assignment) => assignment.ipAddressId))];

      // First, create audit logs BEFORE deleting (while equipment still exists)
      await tx.auditLog.createMany({
        data: existingIds.map((id) => {
          const eq = existingEquipment.find((e) => e.id === id);
          return {
            userId: session.user.id,
            action: "EQUIPMENT_DELETED",
            entityType: "EQUIPMENT",
            entityId: id,
            equipmentId: id, // Reference equipment while it still exists
            details: {
              bulkDelete: true,
              name: eq?.name || "Unknown",
            },
          };
        }),
      });

      // Delete all IP assignments (both active and inactive)
      await tx.iPAssignment.deleteMany({
        where: {
          equipmentId: { in: existingIds },
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
            equipmentId: { in: existingIds },
          },
          data: {
            equipmentId: null,
          },
        });
      } catch (alertError) {
        // Log but don't fail if alerts can't be updated
        console.warn("Could not update alerts for equipment:", alertError);
      }

      const deleted = await tx.equipment.deleteMany({
        where: {
          id: { in: existingIds },
        },
      });
      
      console.log(`Successfully deleted ${deleted.count} equipment items:`, existingIds);

      return { deleted, missingIds };
    });

    // Verify deletions
    const remainingEquipment = await prisma.equipment.findMany({
      where: {
        id: { in: existingIds },
      },
      select: { id: true, name: true },
    });
    
    if (remainingEquipment.length > 0) {
      console.error(`WARNING: ${remainingEquipment.length} equipment items still exist after deletion:`, remainingEquipment);
    }

    // Check if all equipment was deleted
    if (result.deleted.count !== existingIds.length) {
      console.warn(
        `Expected to delete ${existingIds.length} equipment, but only deleted ${result.deleted.count}`
      );
    }

    let message = `Successfully deleted ${result.deleted.count} equipment item${result.deleted.count !== 1 ? "s" : ""}`;
    if (missingIds.length > 0) {
      message += `. ${missingIds.length} item${missingIds.length !== 1 ? "s" : ""} not found.`;
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.deleted.count,
      message,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
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
          errorMessage = "Some equipment items were not found";
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

