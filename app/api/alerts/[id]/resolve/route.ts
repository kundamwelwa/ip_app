import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/alerts/[id]/resolve - Resolve alert
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { resolutionNote } = body;

    // Check if alert exists
    const existingAlert = await prisma.alert.findUnique({
      where: { id: params.id },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Check if already resolved
    if (existingAlert.isResolved || existingAlert.status === "RESOLVED") {
      return NextResponse.json(
        { error: "Alert already resolved" },
        { status: 400 }
      );
    }

    // TECHNICIANS can only resolve acknowledged or approved alerts
    if (session.user.role === "TECHNICIAN") {
      if (existingAlert.status !== "ACKNOWLEDGED" && existingAlert.status !== "APPROVED") {
        return NextResponse.json(
          { error: "You can only resolve acknowledged or approved alerts" },
          { status: 403 }
        );
      }
    }

    // ADMIN and MANAGER can resolve any alert
    // Update alert
    const alert = await prisma.alert.update({
      where: { id: params.id },
      data: {
        status: "RESOLVED",
        isResolved: true,
        resolvedBy: session.user.id,
        resolvedAt: new Date(),
        resolutionNote: resolutionNote || "Alert resolved",
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
        resolver: {
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
        action: "ALERT_RESOLVED",
        entityType: "ALERT",
        entityId: alert.id,
        userId: session.user.id,
        details: {
          alertType: alert.type,
          severity: alert.severity,
          title: alert.title,
          resolutionNote: resolutionNote || "Alert resolved",
        },
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error resolving alert:", error);
    return NextResponse.json(
      { error: "Failed to resolve alert" },
      { status: 500 }
    );
  }
}

