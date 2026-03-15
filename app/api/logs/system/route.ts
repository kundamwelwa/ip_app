import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strictly Super Admin
    if (!isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Filter by system-level actions
    const systemActions = ["MODIFIED_PRIVILEGES", "DEACTIVATED_USER", "USER_REGISTERED"];

    const logs = await prisma.auditLog.findMany({
      where: {
        action: { in: systemActions },
      },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit
    });

    return NextResponse.json({ systemLogs: logs });
  } catch (error) {
    console.error("System Log fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
