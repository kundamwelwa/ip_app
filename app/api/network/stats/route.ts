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

    // Get current network statistics
    const [
      totalEquipment,
      onlineEquipment,
      totalIPAddresses,
      assignedIPAddresses,
      totalNodes,
      activeAlerts,
      recentStats,
    ] = await Promise.all([
      prisma.equipment.count(),
      prisma.equipment.count({ where: { status: "ONLINE" } }),
      prisma.iPAddress.count(),
      prisma.iPAddress.count({ where: { status: "ASSIGNED" } }),
      prisma.equipment.count({ where: { type: "RAJANT_NODE" } }),
      prisma.alert.count({ where: { isResolved: false } }),
      prisma.networkStats.findFirst({
        orderBy: { recordedAt: "desc" },
      }),
    ]);

    // Calculate mesh strength (average of online equipment)
    const onlineEquipmentWithMesh = await prisma.equipment.findMany({
      where: {
        status: "ONLINE",
        meshStrength: { not: null },
      },
      select: { meshStrength: true },
    });

    const averageMeshStrength = onlineEquipmentWithMesh.length > 0
      ? Math.round(
          onlineEquipmentWithMesh.reduce((sum, eq) => sum + (eq.meshStrength || 0), 0) /
          onlineEquipmentWithMesh.length
        )
      : 0;

    // Get equipment status breakdown
    const statusBreakdown = await prisma.equipment.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    // Get recent alerts
    const recentAlerts = await prisma.alert.findMany({
      where: { isResolved: false },
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
            address: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get recent equipment activity
    const recentEquipment = await prisma.equipment.findMany({
      include: {
        ipAssignments: {
          where: { isActive: true },
          include: {
            ipAddress: {
              select: {
                address: true,
              },
            },
          },
        },
      },
      orderBy: { lastSeen: "desc" },
      take: 10,
    });

    const networkStats = {
      totalNodes,
      activeNodes: onlineEquipment,
      totalEquipment,
      onlineEquipment,
      offlineEquipment: totalEquipment - onlineEquipment,
      totalIPAddresses,
      assignedIPAddresses,
      availableIPAddresses: totalIPAddresses - assignedIPAddresses,
      meshStrength: averageMeshStrength,
      bandwidth: recentStats?.bandwidth || "2.4 Gbps",
      latency: recentStats?.latency || 12,
      uptime: recentStats?.uptime || 99.7,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentAlerts,
      recentEquipment,
    };

    return NextResponse.json(networkStats);
  } catch (error) {
    console.error("Error fetching network stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch network statistics" },
      { status: 500 }
    );
  }
}
