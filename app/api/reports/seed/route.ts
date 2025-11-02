import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/reports/seed - Seed default report templates (Admin only)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const defaultTemplates = [
      {
        name: "Equipment Status Report",
        description: "Comprehensive report on equipment status, utilization, and performance metrics",
        type: "equipment_status",
        category: "equipment",
        isDefault: true,
        estimatedTime: "2-3 minutes",
        parameters: [
          {
            name: "dateRange",
            label: "Date Range",
            type: "daterange",
            required: true,
          },
          {
            name: "equipmentType",
            label: "Equipment Type",
            type: "select",
            required: false,
            options: ["All", "Truck", "Excavator", "Drill", "Loader", "Dozer", "Shovel", "Crusher", "Conveyor"],
          },
          {
            name: "includeOffline",
            label: "Include Offline Equipment",
            type: "select",
            required: false,
            options: ["Yes", "No"],
            defaultValue: "Yes",
          },
          {
            name: "includeCharts",
            label: "Include Charts",
            type: "select",
            required: false,
            options: ["Yes", "No"],
            defaultValue: "Yes",
          },
        ],
      },
      {
        name: "IP Address Management Report",
        description: "Detailed report on IP address allocation, assignments, and conflicts",
        type: "ip_management",
        category: "network",
        isDefault: true,
        estimatedTime: "1-2 minutes",
        parameters: [
          {
            name: "dateRange",
            label: "Date Range",
            type: "daterange",
            required: true,
          },
          {
            name: "includeConflicts",
            label: "Include Conflicts",
            type: "select",
            required: false,
            options: ["Yes", "No"],
            defaultValue: "Yes",
          },
          {
            name: "subnet",
            label: "Specific Subnet (Optional)",
            type: "text",
            required: false,
          },
        ],
      },
      {
        name: "Network Performance Report",
        description: "Network performance metrics, latency, packet loss, and signal strength analysis",
        type: "network_performance",
        category: "network",
        isDefault: true,
        estimatedTime: "3-5 minutes",
        parameters: [
          {
            name: "dateRange",
            label: "Date Range",
            type: "daterange",
            required: true,
          },
          {
            name: "metricType",
            label: "Metric Type",
            type: "select",
            required: false,
            options: ["All", "Latency", "Packet Loss", "Signal Strength", "Bandwidth"],
          },
          {
            name: "nodeId",
            label: "Specific Node (Optional)",
            type: "text",
            required: false,
          },
        ],
      },
      {
        name: "Maintenance Schedule Report",
        description: "Maintenance schedules, history, and upcoming maintenance requirements",
        type: "maintenance",
        category: "maintenance",
        isDefault: true,
        estimatedTime: "2-3 minutes",
        parameters: [
          {
            name: "dateRange",
            label: "Date Range",
            type: "daterange",
            required: true,
          },
          {
            name: "includeCompleted",
            label: "Include Completed Maintenance",
            type: "select",
            required: false,
            options: ["Yes", "No"],
            defaultValue: "Yes",
          },
        ],
      },
      {
        name: "System Alerts Report",
        description: "Summary of system alerts, their status, resolution time, and trends",
        type: "alerts",
        category: "alerts",
        isDefault: true,
        estimatedTime: "1-2 minutes",
        parameters: [
          {
            name: "dateRange",
            label: "Date Range",
            type: "daterange",
            required: true,
          },
          {
            name: "severity",
            label: "Alert Severity",
            type: "select",
            required: false,
            options: ["All", "CRITICAL", "ERROR", "WARNING", "INFO", "LOW"],
          },
          {
            name: "status",
            label: "Alert Status",
            type: "select",
            required: false,
            options: ["All", "PENDING", "ACKNOWLEDGED", "APPROVED", "REJECTED", "RESOLVED"],
          },
        ],
      },
      {
        name: "Equipment Utilization Report",
        description: "Equipment usage patterns, operating hours, and utilization rates",
        type: "equipment_utilization",
        category: "equipment",
        isDefault: false,
        estimatedTime: "3-4 minutes",
        parameters: [
          {
            name: "dateRange",
            label: "Date Range",
            type: "daterange",
            required: true,
          },
          {
            name: "groupBy",
            label: "Group By",
            type: "select",
            required: false,
            options: ["Equipment Type", "Location", "Operator"],
          },
        ],
      },
      {
        name: "Custom Report",
        description: "Build a custom report with specific data sources and parameters",
        type: "custom",
        category: "custom",
        isDefault: false,
        estimatedTime: "Varies",
        parameters: [
          {
            name: "reportName",
            label: "Report Name",
            type: "text",
            required: true,
          },
          {
            name: "dateRange",
            label: "Date Range",
            type: "daterange",
            required: true,
          },
          {
            name: "dataSources",
            label: "Data Sources",
            type: "select",
            required: true,
            options: ["Equipment", "IP Management", "Network", "Alerts", "Maintenance"],
          },
        ],
      },
    ];

    // Check if templates already exist
    const existingCount = await prisma.reportTemplate.count();
    if (existingCount > 0) {
      return NextResponse.json(
        { message: "Templates already seeded", count: existingCount },
        { status: 200 }
      );
    }

    // Create templates
    const createdTemplates = await prisma.reportTemplate.createMany({
      data: defaultTemplates,
    });

    return NextResponse.json({
      message: "Default templates seeded successfully",
      count: createdTemplates.count,
    });
  } catch (error) {
    console.error("Error seeding templates:", error);
    return NextResponse.json(
      { error: "Failed to seed templates" },
      { status: 500 }
    );
  }
}

