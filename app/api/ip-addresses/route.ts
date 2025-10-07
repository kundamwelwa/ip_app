import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const subnet = searchParams.get("subnet");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause
    const where: {
      status?: string;
      subnet?: string;
      OR?: Array<{
        address?: { contains: string; mode: "insensitive" };
        notes?: { contains: string; mode: "insensitive" };
      }>;
    } = {};
    if (status) where.status = status;
    if (subnet) where.subnet = subnet;
    if (search) {
      where.OR = [
        { address: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get IP addresses with pagination
    const [ipAddresses, total] = await Promise.all([
      prisma.iPAddress.findMany({
        where,
        include: {
          assignments: {
            where: { isActive: true },
            include: {
              equipment: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  status: true,
                },
              },
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              assignments: { where: { isActive: true } },
            },
          },
        },
        orderBy: { address: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.iPAddress.count({ where }),
    ]);

    return NextResponse.json({
      ipAddresses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching IP addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch IP addresses" },
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
    const { address, subnet, gateway, dns, notes, isReserved } = body;

    // Validate required fields
    if (!address || !subnet) {
      return NextResponse.json(
        { error: "IP address and subnet are required" },
        { status: 400 }
      );
    }

    // Validate IP address format (basic validation)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(address)) {
      return NextResponse.json(
        { error: "Invalid IP address format" },
        { status: 400 }
      );
    }

    // Check for duplicate IP address
    const existing = await prisma.iPAddress.findUnique({
      where: { address },
    });
    if (existing) {
      return NextResponse.json(
        { error: "IP address already exists" },
        { status: 400 }
      );
    }

    // Create IP address
    const ipAddress = await prisma.iPAddress.create({
      data: {
        address,
        subnet,
        gateway,
        dns,
        notes,
        isReserved: isReserved || false,
        status: isReserved ? "RESERVED" : "AVAILABLE",
      },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            equipment: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "IP_ADDRESS_CREATED",
        entityType: "IP_ADDRESS",
        entityId: ipAddress.id,
        userId: session.user.id,
        ipAddressId: ipAddress.id,
        details: {
          address: ipAddress.address,
          subnet: ipAddress.subnet,
        },
      },
    });

    return NextResponse.json(ipAddress, { status: 201 });
  } catch (error) {
    console.error("Error creating IP address:", error);
    return NextResponse.json(
      { error: "Failed to create IP address" },
      { status: 500 }
    );
  }
}
