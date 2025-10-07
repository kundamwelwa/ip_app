import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  checkEquipmentStatus, 
  checkAllEquipmentStatus, 
  processEquipmentHeartbeat,
  getEquipmentCommunicationStatus 
} from "@/lib/equipment-communication";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get("equipmentId");
    const checkAll = searchParams.get("checkAll") === "true";

    if (checkAll) {
      // Check all equipment status
      const results = await checkAllEquipmentStatus();
      return NextResponse.json({
        success: true,
        results,
        timestamp: new Date().toISOString()
      });
    } else if (equipmentId) {
      // Check specific equipment
      const result = await checkEquipmentStatus(equipmentId);
      return NextResponse.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: "equipmentId parameter is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in equipment communication API:", error);
    return NextResponse.json(
      { error: "Failed to check equipment communication" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, equipmentId, heartbeat } = body;

    switch (action) {
      case "check":
        if (!equipmentId) {
          return NextResponse.json(
            { error: "equipmentId is required for check action" },
            { status: 400 }
          );
        }
        const result = await checkEquipmentStatus(equipmentId);
        return NextResponse.json({
          success: true,
          result,
          timestamp: new Date().toISOString()
        });

      case "heartbeat":
        if (!heartbeat) {
          return NextResponse.json(
            { error: "heartbeat data is required" },
            { status: 400 }
          );
        }
        const heartbeatResult = await processEquipmentHeartbeat(heartbeat);
        return NextResponse.json({
          success: heartbeatResult,
          timestamp: new Date().toISOString()
        });

      case "status":
        if (!equipmentId) {
          return NextResponse.json(
            { error: "equipmentId is required for status action" },
            { status: 400 }
          );
        }
        const status = await getEquipmentCommunicationStatus(equipmentId);
        return NextResponse.json({
          success: true,
          status,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: check, heartbeat, status" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in equipment communication API:", error);
    return NextResponse.json(
      { error: "Failed to process equipment communication request" },
      { status: 500 }
    );
  }
}
