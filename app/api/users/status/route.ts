import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      deactivationReason: true,
      deactivatedAt: true,
      suspendedUntil: true,
      sessionVersion: true,
      bannerMessage: true,
      bannerExpiresAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...user,
      deactivatedAt: user.deactivatedAt ? user.deactivatedAt.toISOString() : null,
      suspendedUntil: user.suspendedUntil ? user.suspendedUntil.toISOString() : null,
      bannerExpiresAt: user.bannerExpiresAt ? user.bannerExpiresAt.toISOString() : null,
    },
  });
}
