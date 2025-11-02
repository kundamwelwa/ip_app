import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/[id] - Fetch a specific report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.report.findUnique({
      where: { id },
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
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const formattedReport = {
      id: report.id,
      name: report.name,
      type: report.type,
      category: report.category,
      description: report.description,
      status: report.status.toLowerCase(),
      format: report.format,
      fileSize: report.fileSize,
      downloadUrl: report.downloadUrl,
      parameters: report.parameters,
      generatedBy: `${report.user.firstName} ${report.user.lastName}`,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      completedAt: report.completedAt?.toISOString(),
      failedAt: report.failedAt?.toISOString(),
    };

    return NextResponse.json({ report: formattedReport });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check if user owns the report or is admin
    if (report.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to delete this report" },
        { status: 403 }
      );
    }

    // TODO: In production, also delete the file from storage
    await prisma.report.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}

