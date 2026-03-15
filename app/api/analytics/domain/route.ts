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

    // Analytics: Find domain active vs inactive vs all
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        isActive: true,
        role: true,
      }
    });

    let activeFqmlCount = 0;
    let inactiveFqmlCount = 0;
    let otherDomainCount = 0;
    let pendingAdmins = 0;

    for (const u of allUsers) {
      if (u.email.toLowerCase().endsWith('@fqml.com')) {
        if (u.isActive) {
          activeFqmlCount++;
        } else {
          inactiveFqmlCount++;
          if (u.role === 'ADMIN') pendingAdmins++;
        }
      } else {
        // Legacy support mapping
        otherDomainCount++;
      }
    }

    return NextResponse.json({ 
      analytics: {
        activeFqmlCount,
        inactiveFqmlCount,
        otherDomainCount,
        pendingAdmins,
        total: allUsers.length
      } 
    });

  } catch (error) {
    console.error("Domain analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
