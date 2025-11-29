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

    const { ipAddressIds } = await request.json();

    if (!Array.isArray(ipAddressIds) || ipAddressIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid IP address IDs" },
        { status: 400 }
      );
    }

    // Delete all IP addresses in a transaction
    const deletedIPs = await prisma.$transaction(async (tx) => {
      // First, delete all IP assignments (cascade delete)
      await tx.iPAssignment.deleteMany({
        where: {
          ipAddressId: { in: ipAddressIds },
        },
      });

      // Then delete the IP addresses
      const deleted = await tx.iPAddress.deleteMany({
        where: {
          id: { in: ipAddressIds },
        },
      });

      // Create audit logs
      await tx.auditLog.createMany({
        data: ipAddressIds.map((id) => ({
          userId: session.user.id,
          action: "IP_ADDRESS_DELETED",
          entityType: "IP_ADDRESS",
          entityId: id,
          details: { bulkDelete: true },
        })),
      });

      return deleted;
    });

    return NextResponse.json({
      success: true,
      deletedCount: deletedIPs.count,
      message: `Successfully deleted ${deletedIPs.count} IP address${deletedIPs.count !== 1 ? "es" : ""}`,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete IP addresses" },
      { status: 500 }
    );
  }
}

