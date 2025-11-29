import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ipAddressIds, reserved } = await request.json();

    if (!Array.isArray(ipAddressIds) || ipAddressIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid IP address IDs" },
        { status: 400 }
      );
    }

    const isReserved = reserved !== false; // Default to true

    // Update all IP addresses
    const updatedIPs = await prisma.$transaction(async (tx) => {
      const updated = await tx.iPAddress.updateMany({
        where: {
          id: { in: ipAddressIds },
          status: "AVAILABLE", // Only update available IPs
        },
        data: {
          status: isReserved ? "RESERVED" : "AVAILABLE",
          isReserved: isReserved,
        },
      });

      // Create audit logs
      await tx.auditLog.createMany({
        data: ipAddressIds.map((id) => ({
          userId: session.user.id,
          action: isReserved ? "IP_ADDRESS_RESERVED" : "IP_ADDRESS_UNRESERVED",
          entityType: "IP_ADDRESS",
          entityId: id,
          details: { bulkReserve: true, reserved: isReserved },
        })),
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      updatedCount: updatedIPs.count,
      message: `Successfully ${isReserved ? "reserved" : "unreserved"} ${updatedIPs.count} IP address${updatedIPs.count !== 1 ? "es" : ""}`,
    });
  } catch (error) {
    console.error("Bulk reserve error:", error);
    return NextResponse.json(
      { error: "Failed to update IP addresses" },
      { status: 500 }
    );
  }
}

