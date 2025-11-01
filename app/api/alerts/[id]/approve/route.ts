import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/alerts/[id]/approve - Approve alert (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can approve alerts
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can approve alerts" },
        { status: 403 }
      );
    }

    // Check if alert exists
    const existingAlert = await prisma.alert.findUnique({
      where: { id: params.id },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Check if already approved or rejected
    if (existingAlert.status === "APPROVED") {
      return NextResponse.json(
        { error: "Alert already approved" },
        { status: 400 }
      );
    }

    if (existingAlert.status === "REJECTED") {
      return NextResponse.json(
        { error: "Alert has been rejected" },
        { status: 400 }
      );
    }

    // Update alert
    const alert = await prisma.alert.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        // Auto-acknowledge when approving if not already acknowledged
        ...((!existingAlert.acknowledgedBy) && {
          acknowledgedBy: session.user.id,
          acknowledgedAt: new Date(),
        }),
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
        approver: {
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
        action: "ALERT_APPROVED",
        entityType: "ALERT",
        entityId: alert.id,
        userId: session.user.id,
        details: {
          alertType: alert.type,
          severity: alert.severity,
          title: alert.title,
        },
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error approving alert:", error);
    return NextResponse.json(
      { error: "Failed to approve alert" },
      { status: 500 }
    );
  }
}

