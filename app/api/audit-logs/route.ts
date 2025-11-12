import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType");
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const where: any = {};
    
    if (entityType) {
      where.entityType = entityType;
    }
    
    if (entity) {
      where.entity = {
        contains: entity,
        mode: "insensitive",
      };
    }
    
    if (action) {
      where.action = {
        contains: action,
        mode: "insensitive",
      };
    }

    // Fetch audit logs with user, IP address, and equipment information
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        ipAddress: {
          select: {
            address: true,
            subnet: true,
          },
        },
        equipment: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({
      auditLogs,
      count: auditLogs.length,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

