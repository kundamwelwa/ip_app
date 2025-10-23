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

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Equipment Utilization Report
    if (reportType === "equipment_utilization") {
      const equipment = await prisma.equipment.findMany({
        include: {
          ipAssignments: {
            where: { isActive: true },
          },
          auditLogs: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      const utilizationData = equipment.map((eq) => ({
        id: eq.id,
        name: eq.name,
        type: eq.type,
        status: eq.status,
        location: eq.location,
        operator: eq.operator,
        hasIP: eq.ipAssignments.length > 0,
        lastSeen: eq.lastSeen,
        meshStrength: eq.meshStrength,
        recentActivity: eq.auditLogs.length,
      }));

      return NextResponse.json({
        reportType: "equipment_utilization",
        generatedAt: new Date().toISOString(),
        data: utilizationData,
        summary: {
          totalEquipment: equipment.length,
          onlineEquipment: equipment.filter((e) => e.status === "ONLINE").length,
          offlineEquipment: equipment.filter((e) => e.status === "OFFLINE").length,
          maintenanceEquipment: equipment.filter((e) => e.status === "MAINTENANCE").length,
        },
      });
    }

    // IP Assignment History Report
    if (reportType === "ip_history") {
      const dateFilter = startDate && endDate ? {
        assignedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      } : {};

      const assignments = await prisma.iPAssignment.findMany({
        where: dateFilter,
        include: {
          ipAddress: true,
          equipment: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
        take: 100,
      });

      return NextResponse.json({
        reportType: "ip_history",
        generatedAt: new Date().toISOString(),
        data: assignments.map((a) => ({
          id: a.id,
          ipAddress: a.ipAddress.address,
          equipmentName: a.equipment?.name || "N/A",
          equipmentType: a.equipment?.type || "N/A",
          assignedAt: a.assignedAt,
          releasedAt: a.releasedAt,
          isActive: a.isActive,
          assignedBy: `${a.user.firstName} ${a.user.lastName}`,
          notes: a.notes,
        })),
        summary: {
          totalAssignments: assignments.length,
          activeAssignments: assignments.filter((a) => a.isActive).length,
          releasedAssignments: assignments.filter((a) => !a.isActive).length,
        },
      });
    }

    // Network Uptime Report
    if (reportType === "network_uptime") {
      const dateFilter = startDate && endDate ? {
        recordedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      } : {
        recordedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      };

      const networkStats = await prisma.networkStats.findMany({
        where: dateFilter,
        orderBy: { recordedAt: "asc" },
      });

      const averageUptime = networkStats.length > 0
        ? networkStats.reduce((sum, stat) => sum + stat.uptime, 0) / networkStats.length
        : 0;

      const averageMeshStrength = networkStats.length > 0
        ? networkStats.reduce((sum, stat) => sum + stat.meshStrength, 0) / networkStats.length
        : 0;

      return NextResponse.json({
        reportType: "network_uptime",
        generatedAt: new Date().toISOString(),
        data: networkStats.map((stat) => ({
          recordedAt: stat.recordedAt,
          totalNodes: stat.totalNodes,
          activeNodes: stat.activeNodes,
          meshStrength: stat.meshStrength,
          bandwidth: stat.bandwidth,
          latency: stat.latency,
          uptime: stat.uptime,
        })),
        summary: {
          averageUptime: parseFloat(averageUptime.toFixed(2)),
          averageMeshStrength: Math.round(averageMeshStrength),
          dataPoints: networkStats.length,
          periodStart: networkStats[0]?.recordedAt || new Date(),
          periodEnd: networkStats[networkStats.length - 1]?.recordedAt || new Date(),
        },
      });
    }

    // Alerts Report
    if (reportType === "alerts") {
      const dateFilter = startDate && endDate ? {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      } : {};

      const alerts = await prisma.alert.findMany({
        where: dateFilter,
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
          resolver: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({
        reportType: "alerts",
        generatedAt: new Date().toISOString(),
        data: alerts.map((alert) => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          equipmentName: alert.equipment?.name || "N/A",
          ipAddress: alert.ipAddress?.address || "N/A",
          isResolved: alert.isResolved,
          createdAt: alert.createdAt,
          resolvedAt: alert.resolvedAt,
          resolvedBy: alert.resolver ? `${alert.resolver.firstName} ${alert.resolver.lastName}` : null,
        })),
        summary: {
          totalAlerts: alerts.length,
          resolved: alerts.filter((a) => a.isResolved).length,
          unresolved: alerts.filter((a) => !a.isResolved).length,
          bySeverity: {
            critical: alerts.filter((a) => a.severity === "CRITICAL").length,
            error: alerts.filter((a) => a.severity === "ERROR").length,
            warning: alerts.filter((a) => a.severity === "WARNING").length,
            info: alerts.filter((a) => a.severity === "INFO").length,
            low: alerts.filter((a) => a.severity === "LOW").length,
          },
        },
      });
    }

    // Default: List available report types
    return NextResponse.json({
      message: "Reports API",
      availableReports: [
        {
          type: "equipment_utilization",
          description: "Equipment utilization and status report",
          parameters: [],
        },
        {
          type: "ip_history",
          description: "IP assignment history report",
          parameters: ["startDate (optional)", "endDate (optional)"],
        },
        {
          type: "network_uptime",
          description: "Network uptime and performance report",
          parameters: ["startDate (optional)", "endDate (optional)"],
        },
        {
          type: "alerts",
          description: "System alerts report",
          parameters: ["startDate (optional)", "endDate (optional)"],
        },
      ],
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

