import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/alerts/[id]/reject - Reject alert (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can reject alerts
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can reject alerts" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // Check if alert exists
    const existingAlert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Check if already approved or rejected
    if (existingAlert.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot reject an approved alert" },
        { status: 400 }
      );
    }

    if (existingAlert.status === "REJECTED") {
      return NextResponse.json(
        { error: "Alert already rejected" },
        { status: 400 }
      );
    }

    // Update alert
    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedBy: session.user.id,
        rejectedAt: new Date(),
        resolutionNote: reason || "Rejected by administrator",
      },
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
        rejecter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "ALERT_REJECTED",
        entityType: "ALERT",
        entityId: alert.id,
        userId: session.user.id,
        details: {
          alertType: alert.type,
          severity: alert.severity,
          title: alert.title,
          reason: reason || "No reason provided",
        },
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error rejecting alert:", error);
    return NextResponse.json(
      { error: "Failed to reject alert" },
      { status: 500 }
    );
  }
}

