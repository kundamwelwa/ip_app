import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports - Fetch all reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }
    if (type && type !== "all") {
      where.type = type;
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const formattedReports = reports.map((report) => ({
      id: report.id,
      name: report.name,
      type: report.type,
      category: report.category,
      description: report.description || "",
      generatedAt: report.createdAt.toISOString(),
      generatedBy: `${report.user.firstName} ${report.user.lastName}`,
      status: report.status.toLowerCase(),
      fileSize: report.fileSize,
      downloadUrl: report.downloadUrl,
      format: report.format || "pdf",
      parameters: report.parameters as Record<string, any>,
    }));

    return NextResponse.json({ reports: formattedReports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
