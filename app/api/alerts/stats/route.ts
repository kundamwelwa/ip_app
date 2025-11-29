import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/alerts/stats - Get alert statistics
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalAlerts,
      pendingAlerts,
      acknowledgedAlerts,
      approvedAlerts,
      rejectedAlerts,
      resolvedAlerts,
      criticalAlerts,
      errorAlerts,
      warningAlerts,
      infoAlerts,
      lowAlerts,
      todayAlerts,
      weekAlerts,
    ] = await Promise.all([
      // Total counts by status
      prisma.alert.count(),
      prisma.alert.count({ where: { status: "PENDING" } }),
      prisma.alert.count({ where: { status: "ACKNOWLEDGED" } }),
      prisma.alert.count({ where: { status: "APPROVED" } }),
      prisma.alert.count({ where: { status: "REJECTED" } }),
      prisma.alert.count({ where: { status: "RESOLVED" } }),

      // Counts by severity
      prisma.alert.count({ where: { severity: "CRITICAL", isResolved: false } }),
      prisma.alert.count({ where: { severity: "ERROR", isResolved: false } }),
      prisma.alert.count({ where: { severity: "WARNING", isResolved: false } }),
      prisma.alert.count({ where: { severity: "INFO", isResolved: false } }),
      prisma.alert.count({ where: { severity: "LOW", isResolved: false } }),

      // Time-based counts
      prisma.alert.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.alert.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Get alerts by type
    const alertsByType = await prisma.alert.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
      where: {
        isResolved: false,
      },
    });

    // Calculate resolution rate
    const resolutionRate = totalAlerts > 0
      ? ((resolvedAlerts / totalAlerts) * 100).toFixed(2)
      : "0.00";

    // Get average resolution time (in hours)
    const resolvedWithTime = await prisma.alert.findMany({
      where: {
        isResolved: true,
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const avgResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, alert) => {
        const diff = alert.resolvedAt!.getTime() - alert.createdAt.getTime();
        return sum + diff / (1000 * 60 * 60); // Convert to hours
      }, 0) / resolvedWithTime.length
      : 0;

    return NextResponse.json({
      total: totalAlerts,
      byStatus: {
        pending: pendingAlerts,
        acknowledged: acknowledgedAlerts,
        approved: approvedAlerts,
        rejected: rejectedAlerts,
        resolved: resolvedAlerts,
      },
      bySeverity: {
        critical: criticalAlerts,
        error: errorAlerts,
        warning: warningAlerts,
        info: infoAlerts,
        low: lowAlerts,
      },
      byTime: {
        today: todayAlerts,
        thisWeek: weekAlerts,
      },
      byType: alertsByType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
      metrics: {
        resolutionRate: parseFloat(resolutionRate),
        avgResolutionTimeHours: parseFloat(avgResolutionTime.toFixed(2)),
        activeAlerts: totalAlerts - resolvedAlerts,
        requiresAttention: pendingAlerts + acknowledgedAlerts,
      },
    });
  } catch (error) {
    console.error("Error fetching alert stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert statistics" },
      { status: 500 }
    );
  }
}

