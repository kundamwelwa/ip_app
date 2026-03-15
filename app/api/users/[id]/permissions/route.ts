import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Super Admin can modify granular permissions
    if (!isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { permissions } = body;

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: "Invalid payload: permissions must be an array of strings" }, { status: 400 });
    }

    // Check target exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (isSuperAdmin(targetUser.email)) {
      return NextResponse.json({ error: "Cannot modify Super Admin privileges directly" }, { status: 403 });
    }

    // Force Session Expire: By incrementing sessionVersion, we guarantee `lib/auth.ts` will 
    // reject the user's active session during their next token check, forcing them to re-login.
    // @ts-ignore
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        permissions: permissions,
        sessionVersion: { increment: 1 } 
      } as any,
    });

    // Extract Remote Client IP for "God-Eye" Audit Trail
    const remoteIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Root System Log
    await prisma.auditLog.create({
      data: {
        action: "MODIFIED_PRIVILEGES",
        entityType: "USER",
        entityId: updatedUser.id,
        userId: session.user.id,
        details: {
          targetEmail: targetUser.email,
          performedBy: session.user.email,
          newPermissions: permissions,
          forcedSessionExpiry: true,
          ipAddress: remoteIp
        }
      } 
    });

    return NextResponse.json({ 
      message: "Privileges updated and active sessions terminated", 
    });

  } catch (error) {
    console.error("Privilege update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
