import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/analytics - Fetch analytics data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);

    // Get all reports
    const allReports = await prisma.report.findMany();

    // Calculate statistics
    const totalReports = allReports.length;
    const completedReports = allReports.filter((r) => r.status === "COMPLETED");
    const generatingReports = allReports.filter((r) => r.status === "GENERATING");
    const failedReports = allReports.filter((r) => r.status === "FAILED");

    // Calculate average generation time (completed reports only)
    const avgGenerationTime =
      completedReports.length > 0
        ? Math.round(
            completedReports.reduce((sum, r) => {
              if (r.completedAt) {
                const diff = r.completedAt.getTime() - r.createdAt.getTime();
                return sum + diff / 1000; // Convert to seconds
              }
              return sum;
            }, 0) / completedReports.length
          )
        : 0;

    // Success rate
    const successRate =
      totalReports > 0
        ? Math.round((completedReports.length / totalReports) * 100)
        : 0;

    // Reports this week
    const reportsThisWeek = allReports.filter(
      (r) => r.createdAt >= startOfWeek
    ).length;

    // Reports this month
    const reportsThisMonth = allReports.filter(
      (r) => r.createdAt >= startOfMonth
    ).length;

    // Reports by type
    const typeCount: Record<string, number> = {};
    allReports.forEach((r) => {
      const typeName = r.type.replace(/_/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      typeCount[typeName] = (typeCount[typeName] || 0) + 1;
    });

    const reportsByType = Object.entries(typeCount)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / totalReports) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 types

    // Calculate trends (compare with previous periods)
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekReports = allReports.filter(
      (r) => r.createdAt >= lastWeekStart && r.createdAt < startOfWeek
    ).length;

    const lastMonthStart = new Date(startOfMonth);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthReports = allReports.filter(
      (r) => r.createdAt >= lastMonthStart && r.createdAt < startOfMonth
    ).length;

    const weekTrend =
      lastWeekReports > 0
        ? Math.round(((reportsThisWeek - lastWeekReports) / lastWeekReports) * 100)
        : 0;
    const monthTrend =
      lastMonthReports > 0
        ? Math.round(((reportsThisMonth - lastMonthReports) / lastMonthReports) * 100)
        : 0;

    const recentTrends = [
      {
        label: "This Week",
        value: reportsThisWeek,
        trend: weekTrend > 0 ? "up" : weekTrend < 0 ? "down" : "stable",
        percentage: Math.abs(weekTrend),
      },
      {
        label: "This Month",
        value: reportsThisMonth,
        trend: monthTrend > 0 ? "up" : monthTrend < 0 ? "down" : "stable",
        percentage: Math.abs(monthTrend),
      },
      {
        label: "Success Rate",
        value: successRate,
        trend: "stable",
        percentage: 0,
      },
    ];

    const analytics = {
      totalReports,
      completedReports: completedReports.length,
      generatingReports: generatingReports.length,
      failedReports: failedReports.length,
      avgGenerationTime,
      successRate,
      reportsThisWeek,
      reportsThisMonth,
      reportsByType,
      recentTrends,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

