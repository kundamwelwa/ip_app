import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkEquipmentStatus } from "@/lib/equipment-communication";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause
    const where: {
      type?: string;
      status?: string;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        serialNumber?: { contains: string; mode: "insensitive" };
        nodeId?: { contains: string; mode: "insensitive" };
      }>;
    } = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { serialNumber: { contains: search, mode: "insensitive" } },
        { nodeId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get equipment with pagination
    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: {
          ipAssignments: {
            where: { isActive: true },
            include: {
              ipAddress: true,
            },
          },
          _count: {
            select: {
              alerts: { where: { isResolved: false } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.equipment.count({ where }),
    ]);

    return NextResponse.json({
      equipment,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      model,
      manufacturer,
      macAddress,
      serialNumber,
      location,
      operator,
      description,
      notes,
      nodeId,
    } = body;

    // Convert type to uppercase to match enum
    const equipmentType = type?.toUpperCase();

    // Validate required fields
    if (!name || !equipmentType) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    // Check for duplicate MAC address if provided
    if (macAddress) {
      const existing = await prisma.equipment.findUnique({
        where: { macAddress },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Equipment with this MAC address already exists" },
          { status: 400 }
        );
      }
    }

    // Create equipment
    const equipment = await prisma.equipment.create({
      data: {
        name,
        type: equipmentType,
        model,
        manufacturer,
        macAddress,
        serialNumber,
        location,
        operator,
        description,
        notes,
        nodeId,
        status: "ONLINE",
      },
      include: {
        ipAssignments: {
          where: { isActive: true },
          include: {
            ipAddress: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "EQUIPMENT_CREATED",
        entityType: "EQUIPMENT",
        entityId: equipment.id,
        userId: session.user.id,
        equipmentId: equipment.id,
        details: {
          name: equipment.name,
          type: equipment.type,
        },
      },
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json(
      { error: "Failed to create equipment" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, equipmentId } = body;

    if (action === "checkStatus" && equipmentId) {
      // Check real-time equipment status
      const result = await checkEquipmentStatus(equipmentId);
      return NextResponse.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: "Invalid action or missing equipmentId" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error checking equipment status:", error);
    return NextResponse.json(
      { error: "Failed to check equipment status" },
      { status: 500 }
    );
  }
}
