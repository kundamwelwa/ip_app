import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkEquipmentStatus } from "@/lib/equipment-communication";
import * as alertService from "@/lib/alert-service";

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
    const where: any = {};
    if (type) where.type = type.toUpperCase();
    if (status) where.status = status.toUpperCase();
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
      ipAddresses, // Array of IP addresses to assign
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

    // Validate IP addresses if provided
    if (ipAddresses && Array.isArray(ipAddresses) && ipAddresses.length > 0) {
      // Check for duplicate IP addresses in the request
      const ipAddressValues = ipAddresses.map((ip: any) => ip.address);
      const uniqueIPs = new Set(ipAddressValues);
      if (uniqueIPs.size !== ipAddressValues.length) {
        return NextResponse.json(
          { error: "Duplicate IP addresses detected in the request" },
          { status: 400 }
        );
      }

      // Check if any IP addresses are already assigned
      for (const ip of ipAddresses) {
        if (!ip.address) {
          return NextResponse.json(
            { error: "IP address is required for each IP" },
            { status: 400 }
          );
        }

        const existingAssignment = await prisma.iPAssignment.findFirst({
          where: {
            ipAddress: { address: ip.address },
            isActive: true,
          },
          include: {
            equipment: { select: { name: true } },
          },
        });

        if (existingAssignment) {
          return NextResponse.json(
            { 
              error: `IP address ${ip.address} is already assigned to ${existingAssignment.equipment?.name}` 
            },
            { status: 400 }
          );
        }
      }
    }

    // Use a transaction to create equipment and assign IP addresses
    const result = await prisma.$transaction(async (tx) => {
      // Create equipment
      const equipment = await tx.equipment.create({
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
      });

      // Log equipment creation
      await tx.auditLog.create({
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

      // Assign IP addresses if provided
      if (ipAddresses && Array.isArray(ipAddresses) && ipAddresses.length > 0) {
        for (const ipData of ipAddresses) {
          // Create or get IP address record
          let ipAddressRecord = await tx.iPAddress.findUnique({
            where: { address: ipData.address },
          });

          if (!ipAddressRecord) {
            ipAddressRecord = await tx.iPAddress.create({
              data: {
                address: ipData.address,
                subnet: ipData.subnet || "192.168.1.0/24", // Default subnet
                gateway: ipData.gateway || null,
                dns: ipData.dns || null,
                status: "ASSIGNED",
              },
            });
          } else {
            // Update IP address status to ASSIGNED and update optional fields if provided
            ipAddressRecord = await tx.iPAddress.update({
              where: { id: ipAddressRecord.id },
              data: { 
                status: "ASSIGNED",
                subnet: ipData.subnet || ipAddressRecord.subnet,
                gateway: ipData.gateway || ipAddressRecord.gateway,
                dns: ipData.dns || ipAddressRecord.dns,
              },
            });
          }

          // Create IP assignment
          await tx.iPAssignment.create({
            data: {
              equipmentId: equipment.id,
              ipAddressId: ipAddressRecord.id,
              userId: session.user.id,
              isActive: true,
              notes: ipData.notes || null,
            },
          });

          // Create audit log for IP assignment
          await tx.auditLog.create({
            data: {
              action: "IP_ASSIGNED",
              entityType: "IP_ADDRESS",
              entityId: ipAddressRecord.id,
              userId: session.user.id,
              ipAddressId: ipAddressRecord.id,
              equipmentId: equipment.id,
              details: {
                ipAddress: ipData.address,
                equipmentName: equipment.name,
                equipmentType: equipment.type,
                notes: ipData.notes,
              },
            },
          });
        }
      }

      // Fetch the complete equipment with IP assignments
      const completeEquipment = await tx.equipment.findUnique({
        where: { id: equipment.id },
        include: {
          ipAssignments: {
            where: { isActive: true },
            include: {
              ipAddress: true,
            },
          },
        },
      });

      return completeEquipment;
    });

    // Create alerts after transaction is complete (to avoid foreign key constraints)
    if (result) {
      try {
        await alertService.alertEquipmentAdded(
          result.id,
          result.name,
          result.type,
          session.user.id
        );

        // Create alerts for each IP assignment
        if (result.ipAssignments && result.ipAssignments.length > 0) {
          for (const assignment of result.ipAssignments) {
            await alertService.alertIPAssigned(
              assignment.ipAddress.id,
              assignment.ipAddress.address,
              result.id,
              result.name,
              session.user.id
            );
          }
        }
      } catch (alertError) {
        // Log alert errors but don't fail the request
        console.error("Error creating alerts:", alertError);
      }
    }

    return NextResponse.json(result, { status: 201 });
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
