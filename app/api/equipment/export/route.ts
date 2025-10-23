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
    const format = searchParams.get("format") || "json";
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    // Fetch equipment
    const equipment = await prisma.equipment.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    // Transform data for export
    const exportData = equipment.map((eq: any) => ({
      name: eq.name,
      type: eq.type,
      model: eq.model || "",
      manufacturer: eq.manufacturer || "",
      macAddress: eq.macAddress || "",
      serialNumber: eq.serialNumber || "",
      location: eq.location || "",
      operator: eq.operator || "",
      description: eq.description || "",
      notes: eq.notes || "",
      status: eq.status,
      meshStrength: eq.meshStrength || 0,
      nodeId: eq.nodeId || "",
      ipAddress: eq.ipAssignments?.[0]?.ipAddress?.address || "",
      lastSeen: eq.lastSeen?.toISOString() || "",
      createdAt: eq.createdAt.toISOString(),
    }));

    // Export as CSV
    if (format === "csv") {
      const headers = [
        "Name",
        "Type",
        "Model",
        "Manufacturer",
        "MAC Address",
        "Serial Number",
        "Location",
        "Operator",
        "Description",
        "Notes",
        "Status",
        "Mesh Strength",
        "Node ID",
        "IP Address",
        "Last Seen",
        "Created At",
      ];

      const csvRows = [
        headers.join(","),
        ...exportData.map((item) =>
          [
            `"${item.name}"`,
            item.type,
            `"${item.model}"`,
            `"${item.manufacturer}"`,
            item.macAddress,
            item.serialNumber,
            `"${item.location}"`,
            `"${item.operator}"`,
            `"${item.description}"`,
            `"${item.notes}"`,
            item.status,
            item.meshStrength,
            item.nodeId,
            item.ipAddress,
            item.lastSeen,
            item.createdAt,
          ].join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="equipment-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Export as JSON (default)
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      totalRecords: exportData.length,
      data: exportData,
    });
  } catch (error) {
    console.error("Error exporting equipment:", error);
    return NextResponse.json(
      { error: "Failed to export equipment" },
      { status: 500 }
    );
  }
}

