import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/alerts/[id]/acknowledge - Acknowledge alert
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if alert exists
    const existingAlert = await prisma.alert.findUnique({
      where: { id: params.id },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Check if already acknowledged
    if (existingAlert.status === "ACKNOWLEDGED" || existingAlert.status === "APPROVED") {
      return NextResponse.json(
        { error: "Alert already acknowledged" },
        { status: 400 }
      );
    }

    // Update alert
    const alert = await prisma.alert.update({
      where: { id: params.id },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedBy: session.user.id,
        acknowledgedAt: new Date(),
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
        acknowledger: {
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
        action: "ALERT_ACKNOWLEDGED",
        entityType: "ALERT",
        entityId: alert.id,
        userId: session.user.id,
        details: {
          alertType: alert.type,
          severity: alert.severity,
        },
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge alert" },
      { status: 500 }
    );
  }
}

