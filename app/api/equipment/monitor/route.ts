import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  startEquipmentMonitor, 
  stopEquipmentMonitor, 
  isEquipmentMonitorRunning,
  getMonitoringStatus 
} from "@/lib/equipment-monitor";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getMonitoringStatus();
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting monitoring status:", error);
    return NextResponse.json(
      { error: "Failed to get monitoring status" },
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
    const { action, intervalMs = 30000 } = body;

    switch (action) {
      case "start":
        if (isEquipmentMonitorRunning()) {
          return NextResponse.json({
            success: true,
            message: "Equipment monitor is already running",
            status: getMonitoringStatus(),
            timestamp: new Date().toISOString()
          });
        }
        
        startEquipmentMonitor(intervalMs);
        return NextResponse.json({
          success: true,
          message: `Equipment monitor started with ${intervalMs}ms interval`,
          status: getMonitoringStatus(),
          timestamp: new Date().toISOString()
        });

      case "stop":
        if (!isEquipmentMonitorRunning()) {
          return NextResponse.json({
            success: false,
            message: "Equipment monitor is not running",
            status: getMonitoringStatus(),
            timestamp: new Date().toISOString()
          });
        }
        
        stopEquipmentMonitor();
        return NextResponse.json({
          success: true,
          message: "Equipment monitor stopped",
          status: getMonitoringStatus(),
          timestamp: new Date().toISOString()
        });

      case "restart":
        stopEquipmentMonitor();
        startEquipmentMonitor(intervalMs);
        return NextResponse.json({
          success: true,
          message: `Equipment monitor restarted with ${intervalMs}ms interval`,
          status: getMonitoringStatus(),
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: start, stop, restart" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error managing equipment monitor:", error);
    return NextResponse.json(
      { error: "Failed to manage equipment monitor" },
      { status: 500 }
    );
  }
}
