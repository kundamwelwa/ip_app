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
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
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
        deactivationReason: true,
        deactivatedAt: true,
        deactivatedBy: true,
        suspendedUntil: true,
        bannerMessage: true,
        bannerExpiresAt: true,
        createdAt: true,
        updatedAt: true,
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
        deactivatedAt: user.deactivatedAt ? user.deactivatedAt.toISOString() : null,
        suspendedUntil: user.suspendedUntil ? user.suspendedUntil.toISOString() : null,
        bannerExpiresAt: user.bannerExpiresAt ? user.bannerExpiresAt.toISOString() : null,
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
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Prevent user from modifying their own account through this endpoint
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot modify your own account through this endpoint" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      department, 
      role, 
      isActive,
      deactivationReason,
      suspendedUntil,
      bannerMessage,
      bannerExpiresAt,
      action,
    } = body;

    // Only Super Admins can change active status or suspend/kill accounts
    const isStatusAction = ["deactivate", "suspend", "activate"].includes(action) || isActive !== undefined;
    if (isStatusAction && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admins can activate/deactivate accounts" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    // Ensure email is properly formatted before update
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (department !== undefined) updateData.department = department;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      updateData.sessionVersion = { increment: 1 };
      if (isActive) {
        updateData.deactivationReason = null;
        updateData.deactivatedAt = null;
        updateData.deactivatedBy = null;
        updateData.suspendedUntil = null;
      }
    }

    if (["deactivate", "suspend"].includes(action)) {
      updateData.isActive = false;
      updateData.deactivationReason =
        deactivationReason || (action === "suspend" ? "Suspended by administrator" : "Deactivated by administrator");
      updateData.deactivatedAt = new Date();
      updateData.deactivatedBy = session.user.id;
      updateData.suspendedUntil = suspendedUntil ? new Date(suspendedUntil) : null;
      updateData.sessionVersion = { increment: 1 };
    }

    if (action === "activate") {
      updateData.isActive = true;
      updateData.deactivationReason = null;
      updateData.deactivatedAt = null;
      updateData.deactivatedBy = null;
      updateData.suspendedUntil = null;
      updateData.sessionVersion = { increment: 1 };
    }

    if (bannerMessage !== undefined) {
      updateData.bannerMessage = bannerMessage;
      updateData.bannerExpiresAt = bannerMessage
        ? bannerExpiresAt
          ? new Date(bannerExpiresAt)
          : new Date(Date.now() + 5 * 60 * 1000) // default 5 min visibility
        : null;
    }

    if (!updateData.sessionVersion) {
      updateData.sessionVersion = { increment: 1 };
    }

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
        deactivationReason: true,
        deactivatedAt: true,
        deactivatedBy: true,
        suspendedUntil: true,
        bannerMessage: true,
        bannerExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    try {
      const auditAction = action
        ? `USER_${action.toUpperCase()}`
        : "UPDATED_USER";
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: auditAction,
          entityType: "user",
          entityId: user.id,
          details: {
            email: user.email,
            updatedFields: Object.keys(updateData),
            updatedBy: session.user.email,
            reason: deactivationReason,
            suspendedUntil,
            bannerMessage,
          },
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        deactivatedAt: user.deactivatedAt ? user.deactivatedAt.toISOString() : null,
        suspendedUntil: user.suspendedUntil ? user.suspendedUntil.toISOString() : null,
        bannerExpiresAt: user.bannerExpiresAt ? user.bannerExpiresAt.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create audit log before deletion (non-blocking) - Use admin ID as userId
    try {
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
          },
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    // Wrap the deletion in a transaction to satisfy relational foreign key constraints
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { userId: id } }),
      prisma.iPAssignment.deleteMany({ where: { userId: id } }),
      prisma.report.deleteMany({ where: { userId: id } }),
      prisma.alert.updateMany({ where: { acknowledgedBy: id }, data: { acknowledgedBy: null } }),
      prisma.alert.updateMany({ where: { approvedBy: id }, data: { approvedBy: null } }),
      prisma.alert.updateMany({ where: { rejectedBy: id }, data: { rejectedBy: null } }),
      prisma.alert.updateMany({ where: { resolvedBy: id }, data: { resolvedBy: null } }),
      prisma.user.delete({ where: { id } }),
    ]);

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
