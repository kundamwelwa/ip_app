import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/alerts - Get all alerts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const type = searchParams.get("type");
    const equipmentId = searchParams.get("equipmentId");
    const ipAddressId = searchParams.get("ipAddressId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Role-based filtering
    // TECHNICIANS can only see acknowledged/resolved alerts
    if (session.user.role === "TECHNICIAN") {
      where.status = { in: ["ACKNOWLEDGED", "RESOLVED", "APPROVED"] };
    }

    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (type) where.type = type;
    if (equipmentId) where.equipmentId = equipmentId;
    if (ipAddressId) where.ipAddressId = ipAddressId;

    // Date range filter
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          ipAddress: {
            select: {
              id: true,
              address: true,
            },
          },
          acknowledger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          rejecter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          resolver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { severity: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.alert.count({ where }),
    ]);

    return NextResponse.json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create new alert
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and MANAGER can create alerts manually
    if (session.user.role === "TECHNICIAN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      type,
      title,
      message,
      severity,
      equipmentId,
      ipAddressId,
      entityType,
      entityId,
      details,
    } = body;

    // Validation
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "Type, title, and message are required" },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        type,
        title,
        message,
        severity: severity || "INFO",
        equipmentId,
        ipAddressId,
        entityType,
        entityId,
        details,
      },
      include: {
        equipment: {
          select: {
            name: true,
            type: true,
          },
        },
        ipAddress: {
          select: {
            address: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "ALERT_CREATED",
        entityType: "ALERT",
        entityId: alert.id,
        userId: session.user.id,
        details: {
          alertType: type,
          severity,
          title,
        },
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

