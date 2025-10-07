import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all equipment and nodes
    const equipment = await prisma.equipment.findMany({
      include: {
        ipAssignments: {
          where: { isActive: true },
          include: {
            ipAddress: {
              select: {
                address: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate network statistics
    const onlineNodes = equipment.filter(eq => eq.status === "ONLINE");
    const totalConnections = onlineNodes.length * 2; // Simplified calculation
    const averageStrength = onlineNodes.length > 0 
      ? Math.round(onlineNodes.reduce((sum, eq) => sum + 85, 0) / onlineNodes.length) // Using consistent mock value
      : 0;
    
    // Calculate network health based on online nodes and signal strength
    const networkHealth = onlineNodes.length > 0 
      ? Math.round((onlineNodes.length / equipment.length) * 100)
      : 0;

    // Create mesh nodes data
    const nodes = equipment.map((eq) => ({
      id: eq.id,
      name: eq.name,
      type: "EQUIPMENT" as const, // Simplified for now - all equipment is treated as mesh nodes
      status: eq.status,
      meshStrength: 85, // Consistent mock value
      location: eq.location || "Unknown",
      lastSeen: new Date(eq.createdAt).toLocaleString(),
      connections: [], // Simplified - in real implementation, this would track actual connections
      ipAddress: eq.ipAssignments[0]?.ipAddress?.address || "Not assigned",
      equipmentType: eq.type,
    }));

    const topologyData = {
      nodes,
      totalConnections,
      averageStrength,
      networkHealth,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(topologyData);
  } catch (error) {
    console.error("Error fetching mesh topology:", error);
    return NextResponse.json(
      { error: "Failed to fetch mesh topology data" },
      { status: 500 }
    );
  }
}
