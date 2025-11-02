import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/[id] - Fetch a specific user (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ipAssignments: true,
            auditLogs: true,
            reports: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PATCH /api/users/[id] - Update a user (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Prevent user from modifying their own account through this endpoint
    // (for safety, they should use a profile update endpoint)
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot modify your own account through this endpoint" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, department, role, isActive } = body;

    // Build update data
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (department !== undefined) updateData.department = department;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATED_USER",
        entityType: "user",
        entityId: user.id,
        details: {
          email: user.email,
          updatedFields: Object.keys(updateData),
          updatedBy: session.user.email,
        },
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete a user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Prevent user from deleting their own account
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { 
        email: true, 
        role: true,
        _count: {
          select: {
            ipAssignments: true,
            reports: true,
            auditLogs: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create audit log before deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETED_USER",
        entityType: "user",
        entityId: id,
        details: {
          email: user.email,
          role: user.role,
          deletedBy: session.user.email,
          relatedRecords: {
            ipAssignments: user._count.ipAssignments,
            reports: user._count.reports,
            auditLogs: user._count.auditLogs,
          }
        },
      },
    });

    // Use a transaction to handle related records safely
    await prisma.$transaction(async (tx) => {
      // Nullify alert relationships (don't delete alerts, just remove user references)
      await tx.alert.updateMany({
        where: { acknowledgedBy: id },
        data: { acknowledgedBy: null },
      });
      await tx.alert.updateMany({
        where: { approvedBy: id },
        data: { approvedBy: null },
      });
      await tx.alert.updateMany({
        where: { rejectedBy: id },
        data: { rejectedBy: null },
      });
      await tx.alert.updateMany({
        where: { resolvedBy: id },
        data: { resolvedBy: null },
      });

      // Delete IP assignments (they belong to the user)
      await tx.iPAssignment.deleteMany({
        where: { userId: id },
      });

      // Delete reports (they belong to the user)
      await tx.report.deleteMany({
        where: { userId: id },
      });

      // Delete audit logs created by this user
      await tx.auditLog.deleteMany({
        where: { userId: id },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}

