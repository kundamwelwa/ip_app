import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { equipment } = body;

    if (!Array.isArray(equipment)) {
      return NextResponse.json(
        { error: "Equipment data must be an array" },
        { status: 400 }
      );
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const item of equipment) {
      try {
        // Validate required fields
        if (!item.name || !item.type) {
          results.failed++;
          results.errors.push(`Missing required fields for equipment: ${item.name || "unknown"}`);
          continue;
        }

        // Check for duplicate MAC address
        if (item.macAddress) {
          const existing = await prisma.equipment.findUnique({
            where: { macAddress: item.macAddress },
          });

          if (existing) {
            results.failed++;
            results.errors.push(`Equipment with MAC address ${item.macAddress} already exists`);
            continue;
          }
        }

        // Create equipment
        await prisma.equipment.create({
          data: {
            name: item.name,
            type: item.type.toUpperCase(),
            model: item.model || null,
            manufacturer: item.manufacturer || null,
            macAddress: item.macAddress || null,
            serialNumber: item.serialNumber || null,
            location: item.location || null,
            operator: item.operator || null,
            description: item.description || null,
            notes: item.notes || null,
            status: item.status?.toUpperCase() || "OFFLINE",
            meshStrength: item.meshStrength ? parseInt(item.meshStrength) : null,
            nodeId: item.nodeId || null,
          },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            action: "EQUIPMENT_IMPORTED",
            entityType: "EQUIPMENT",
            entityId: item.name,
            userId: session.user?.id || "system",
            details: {
              name: item.name,
              type: item.type,
              importedBy: session.user?.email,
            },
          },
        });

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to import equipment ${item.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error("Error importing equipment:", error);
    return NextResponse.json(
      { error: "Failed to import equipment" },
      { status: 500 }
    );
  }
}

