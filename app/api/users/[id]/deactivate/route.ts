import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Awaiting params for Next 15+
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Super Admin or existing ADMIN can deactivate, but we'll prioritize Super Admin OR Admin
    // For purely "Super Admin assigns privileges" model, we could restrict this to Super Admin.
    const hasAccess = isSuperAdmin(session.user.email) || session.user.role === "ADMIN";
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden: Super Admin or Admin access required" }, { status: 403 });
    }

    // Ensure they aren't deactivating the Super Admin!
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { email: true, isActive: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (isSuperAdmin(targetUser.email)) {
      return NextResponse.json({ error: "Cannot deactivate the Super Admin account" }, { status: 403 });
    }

    // Perform deactivation
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        isActive: true,
      }
    });

    // Audit Log for Super Admin/Admin Action
    await prisma.auditLog.create({
      data: {
        action: "DEACTIVATED_USER",
        entityType: "USER",
        entityId: updatedUser.id,
        userId: session.user.id,
        details: {
          targetEmail: updatedUser.email,
          performedBy: session.user.email,
          isSuperAdminAction: isSuperAdmin(session.user.email)
        }
      }
    });

    return NextResponse.json({ 
      message: "Account deactivated successfully", 
      user: updatedUser 
    });

  } catch (error) {
    console.error("Account deactivation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
