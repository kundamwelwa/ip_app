import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admins can trigger the kill-switch" }, { status: 403 });
  }

  const body = await request.json();
  const {
    targetRole = "STANDARD_USER",
    reason = "Mass suspension triggered by Super Admin",
    bannerMessage,
  } = body;

  const where =
    targetRole === "ALL"
      ? {}
      : {
          role: targetRole,
        };

  const now = new Date();

  const result = await prisma.user.updateMany({
    where,
    data: {
      isActive: false,
      deactivationReason: reason,
      deactivatedAt: now,
      deactivatedBy: session.user.id,
      suspendedUntil: null,
      bannerMessage: bannerMessage || null,
      bannerExpiresAt: bannerMessage ? new Date(now.getTime() + 5 * 60 * 1000) : null,
      sessionVersion: { increment: 1 },
    },
  });

  try {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "USER_KILL_SWITCH",
        entityType: "user",
        entityId: "bulk",
        details: {
          targetRole,
          count: result.count,
          reason,
          bannerMessage,
        },
      },
    });
  } catch (error) {
    console.error("Failed to create kill-switch audit log", error);
  }

  return NextResponse.json({
    message: "Kill-switch executed",
    affected: result.count,
  });
}
