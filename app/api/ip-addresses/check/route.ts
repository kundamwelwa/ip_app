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
    const ip = searchParams.get("ip");

    if (!ip) {
      return NextResponse.json(
        { error: "IP address parameter is required" },
        { status: 400 }
      );
    }

    // Validate IP address format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json({
        status: "invalid",
        message: "Invalid IP address format",
        ip,
      });
    }

    // Check if IP exists in database
    const ipAddress = await prisma.iPAddress.findUnique({
      where: { address: ip },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                type: true,
                status: true,
                location: true,
                operator: true,
                lastSeen: true,
                meshStrength: true,
                nodeId: true,
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!ipAddress) {
      return NextResponse.json({
        status: "available",
        message: "IP address is available for assignment",
        ip,
        type: "private", // You can implement logic to determine if IP is private/public
      });
    }

    // Check if IP is assigned to equipment
    const activeAssignment = ipAddress.assignments.find((assignment) => assignment.isActive);

    if (activeAssignment && activeAssignment.equipment) {
      return NextResponse.json({
        status: "assigned",
        message: "IP address is assigned to equipment",
        ip,
        type: "private",
        assignment: {
          assignedAt: activeAssignment.assignedAt,
          assignedBy: `${activeAssignment.user.firstName} ${activeAssignment.user.lastName}`,
          equipment: activeAssignment.equipment,
        },
      });
    }

    // IP exists but not assigned
    return NextResponse.json({
      status: ipAddress.isReserved ? "reserved" : "available",
      message: ipAddress.isReserved 
        ? "IP address is reserved" 
        : "IP address exists but is not assigned",
      ip,
      type: "private",
      isReserved: ipAddress.isReserved,
      notes: ipAddress.notes,
      subnet: ipAddress.subnet,
      gateway: ipAddress.gateway,
      dns: ipAddress.dns ? ipAddress.dns.split(',') : ["8.8.8.8", "8.8.4.4"],
    });
  } catch (error) {
    console.error("Error checking IP address:", error);
    return NextResponse.json(
      { error: "Failed to check IP address" },
      { status: 500 }
    );
  }
}
