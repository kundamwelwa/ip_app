import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/reports/[id]/share - Share a report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { recipients, message } = body;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
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

    if (report.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Report is not ready to be shared" },
        { status: 400 }
      );
    }

    // TODO: In production, implement email sending
    // - Send email to each recipient with download link
    // - Track who the report was shared with
    // - Create audit log entry

    console.log("Sharing report:", {
      reportId: report.id,
      reportName: report.name,
      sharedBy: `${report.user.firstName} ${report.user.lastName}`,
      recipients,
      message,
      downloadUrl: report.downloadUrl,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SHARED_REPORT",
        entityType: "report",
        entityId: report.id,
        details: {
          reportName: report.name,
          recipients: recipients || [],
          message: message || "",
        },
      },
    });

    return NextResponse.json({
      message: "Report shared successfully",
      recipients: recipients || [],
    });
  } catch (error) {
    console.error("Error sharing report:", error);
    return NextResponse.json(
      { error: "Failed to share report" },
      { status: 500 }
    );
  }
}

