import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/ip-addresses/[id] - Get a specific IP address
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ipAddress = await prisma.iPAddress.findUnique({
      where: { id },
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
      return NextResponse.json(
        { error: "IP address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(ipAddress);
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return NextResponse.json(
      { error: "Failed to fetch IP address" },
      { status: 500 }
    );
  }
}

// PATCH /api/ip-addresses/[id] - Update an IP address
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { subnet, gateway, dns, notes, isReserved } = body;

    // Find the IP address
    const existingIP = await prisma.iPAddress.findUnique({
      where: { id },
    });

    if (!existingIP) {
      return NextResponse.json(
        { error: "IP address not found" },
        { status: 404 }
      );
    }

    // Update the IP address
    const updatedIP = await prisma.iPAddress.update({
      where: { id },
      data: {
        subnet: subnet ?? existingIP.subnet,
        gateway: gateway !== undefined ? gateway : existingIP.gateway,
        dns: dns !== undefined ? dns : existingIP.dns,
        notes: notes !== undefined ? notes : existingIP.notes,
        isReserved: isReserved !== undefined ? isReserved : existingIP.isReserved,
      },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            equipment: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "IP_ADDRESS_UPDATED",
        entityType: "IP_ADDRESS",
        entityId: updatedIP.id,
        userId: session.user.id,
        ipAddressId: updatedIP.id,
        details: {
          address: updatedIP.address,
          changes: body,
        },
      },
    });

    return NextResponse.json(updatedIP);
  } catch (error) {
    console.error("Error updating IP address:", error);
    return NextResponse.json(
      { error: "Failed to update IP address" },
      { status: 500 }
    );
  }
}

// DELETE /api/ip-addresses/[id] - Delete an IP address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    console.log(`\n🗑️  DELETE IP Request - ID: ${id}`);

    // Find the IP address with its assignments
    const ip = await prisma.iPAddress.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            equipment: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!ip) {
      console.log(`   ❌ IP address not found`);
      return NextResponse.json(
        { error: "IP address not found" },
        { status: 404 }
      );
    }

    console.log(`   📍 IP Address: ${ip.address}`);
    console.log(`   📊 Active Assignments: ${ip.assignments.length}`);

    // Check if IP has active assignments
    if (ip.assignments && ip.assignments.length > 0) {
      console.log(`   ❌ Cannot delete - has active assignments:`);
      ip.assignments.forEach((a, idx) => {
        console.log(`      ${idx + 1}. ${a.equipment?.name} (${a.equipment?.type})`);
      });

      return NextResponse.json(
        {
          error: `Cannot delete IP ${ip.address}. It has ${ip.assignments.length} active assignment(s). Please unassign it first.`,
          activeAssignments: ip.assignments.map((a) => ({
            equipmentName: a.equipment?.name,
            equipmentType: a.equipment?.type,
            assignedAt: a.assignedAt,
          })),
        },
        { status: 400 }
      );
    }

    // Delete all inactive assignments first
    const inactiveAssignments = await prisma.iPAssignment.findMany({
      where: {
        ipAddressId: id,
        isActive: false,
      },
    });

    if (inactiveAssignments.length > 0) {
      console.log(`   🗑️  Deleting ${inactiveAssignments.length} inactive assignment(s)...`);
      await prisma.iPAssignment.deleteMany({
        where: {
          ipAddressId: id,
          isActive: false,
        },
      });
    }

    // Delete the IP address
    console.log(`   🗑️  Deleting IP address record...`);
    await prisma.iPAddress.delete({
      where: { id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "IP_ADDRESS_DELETED",
        entityType: "IP_ADDRESS",
        entityId: id,
        userId: session.user.id,
        details: {
          address: ip.address,
          subnet: ip.subnet,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`   ✅ IP address deleted successfully\n`);

    return NextResponse.json({
      message: `IP address ${ip.address} deleted successfully`,
      deletedIP: {
        id: ip.id,
        address: ip.address,
      },
    });
  } catch (error: any) {
    console.error("Error deleting IP address:", error);

    // Handle foreign key constraint errors
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Cannot delete IP address. It has related records in the database. Please contact system administrator.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete IP address", details: error.message },
      { status: 500 }
    );
  }
}

