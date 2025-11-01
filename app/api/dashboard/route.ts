import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAllEquipmentStatus } from "@/lib/equipment-communication";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const realTimeCheck = searchParams.get("realTime") === "true";

    // Perform real-time equipment status check if requested
    if (realTimeCheck) {
      console.log("Performing real-time equipment status check...");
      await checkAllEquipmentStatus();
    }

    // Get dashboard data in parallel
    const [
      equipmentData,
      networkStats,
      recentAlerts,
      recentActivity,
      ipStatusSummary,
    ] = await Promise.all([
      // Get equipment data with IP assignments
      prisma.equipment.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          location: true,
          operator: true,
          lastSeen: true,
          meshStrength: true,
          nodeId: true,
          ipAssignments: {
            where: { isActive: true },
            include: {
              ipAddress: {
                select: {
                  id: true,
                  address: true,
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
        },
        orderBy: { lastSeen: "desc" },
        take: 20,
      }),

      // Get network statistics
      (async () => {
        const [
          totalEquipment,
          onlineEquipment,
          totalIPAddresses,
          assignedIPAddresses,
          totalNodes,
        ] = await Promise.all([
          prisma.equipment.count(),
          prisma.equipment.count({ where: { status: "ONLINE" } }),
          prisma.iPAddress.count(),
          prisma.iPAddress.count({ where: { status: "ASSIGNED" } }),
          prisma.equipment.count({ where: { type: "RAJANT_NODE" } }),
        ]);

        // Calculate average mesh strength
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

        return {
          totalNodes,
          activeNodes: onlineEquipment,
          meshStrength: averageMeshStrength,
          bandwidth: "2.4 Gbps",
          latency: "12ms",
          uptime: "99.7%",
        };
      })(),

      // Get recent alerts
      prisma.alert.findMany({
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
        take: 10,
      }),

      // Get recent activity (audit logs)
      prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          equipment: {
            select: {
              name: true,
            },
          },
          ipAddress: {
            select: {
              address: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Get IP address status summary
      prisma.iPAddress.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      }),
    ]);

    // Format equipment data for dashboard
    const formattedEquipment = equipmentData.map((equipment) => {
      const activeAssignment = equipment.ipAssignments[0];
      return {
        id: equipment.id,
        name: equipment.name,
        type: equipment.type,
        status: equipment.status,
        location: equipment.location || "Unknown",
        lastSeen: equipment.lastSeen
          ? new Date(equipment.lastSeen).toLocaleString()
          : "Never",
        meshStrength: equipment.meshStrength || 0,
        nodeId: equipment.nodeId,
        ip: activeAssignment?.ipAddress?.address || "Not assigned",
        ipStatus: activeAssignment?.ipAddress?.status || "AVAILABLE",
        operator: equipment.operator || null,
        assignedBy: activeAssignment?.user
          ? `${activeAssignment.user.firstName} ${activeAssignment.user.lastName}`
          : null,
      };
    });

    // Format alerts for dashboard
    const formattedAlerts = recentAlerts.map((alert) => ({
      id: alert.id,
      type: alert.severity.toLowerCase(),
      message: alert.message,
      time: new Date(alert.createdAt).toLocaleString(),
      equipment: alert.equipment?.name || alert.ipAddress?.address || "System",
    }));

    // Format recent activity
    const formattedActivity = recentActivity.map((log) => ({
      id: log.id,
      action: log.action,
      user: `${log.user.firstName} ${log.user.lastName}`,
      entity: log.equipment?.name || log.ipAddress?.address || "Unknown",
      time: new Date(log.createdAt).toLocaleString(),
    }));

    // Format IP status summary
    const ipSummary = ipStatusSummary.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const dashboardData = {
      equipment: formattedEquipment,
      networkStats,
      alerts: formattedAlerts,
      recentActivity: formattedActivity,
      ipSummary: {
        total: Object.values(ipSummary).reduce((sum, count) => sum + count, 0),
        assigned: ipSummary.ASSIGNED || 0,
        available: ipSummary.AVAILABLE || 0,
        reserved: ipSummary.RESERVED || 0,
        offline: ipSummary.OFFLINE || 0,
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
