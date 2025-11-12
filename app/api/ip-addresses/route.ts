import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as alertService from "@/lib/alert-service";

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
    const where: any = {};
    if (status) where.status = status.toUpperCase() as any;
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
                  location: true,
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

    // Create alert for admin approval
    await alertService.alertIPAddressAdded(
      ipAddress.id,
      ipAddress.address,
      session.user.id
    );

    return NextResponse.json(ipAddress, { status: 201 });
  } catch (error) {
    console.error("Error creating IP address:", error);
    return NextResponse.json(
      { error: "Failed to create IP address" },
      { status: 500 }
    );
  }
}

// DELETE /api/ip-addresses - Delete an IP address
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ipId = searchParams.get("id");
    const ipAddress = searchParams.get("address");

    if (!ipId && !ipAddress) {
      return NextResponse.json(
        { error: "IP ID or address is required" },
        { status: 400 }
      );
    }

    // Find the IP address
    const ip = await prisma.iPAddress.findFirst({
      where: ipId ? { id: ipId } : { address: ipAddress! },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            equipment: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!ip) {
      return NextResponse.json(
        { error: "IP address not found" },
        { status: 404 }
      );
    }

    // Check if IP has active assignments
    if (ip.assignments && ip.assignments.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete IP ${ip.address}. It has ${ip.assignments.length} active assignment(s). Please unassign it first.`,
          activeAssignments: ip.assignments.map(a => ({
            equipmentName: a.equipment?.name,
            assignedAt: a.assignedAt
          }))
        },
        { status: 400 }
      );
    }

    // Delete the IP address
    await prisma.iPAddress.delete({
      where: { id: ip.id }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "IP_ADDRESS_DELETED",
        entityType: "IP_ADDRESS",
        entityId: ip.id,
        userId: session.user.id,
        details: {
          address: ip.address,
          subnet: ip.subnet,
          deletedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      message: `IP address ${ip.address} deleted successfully`,
      deletedIP: {
        id: ip.id,
        address: ip.address
      }
    });

  } catch (error: any) {
    console.error("Error deleting IP address:", error);
    
    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Cannot delete IP address. It has related records. Please unassign it first." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete IP address" },
      { status: 500 }
    );
  }
}
