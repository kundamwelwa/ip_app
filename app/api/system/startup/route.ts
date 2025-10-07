import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { initializeServerServices } from "@/lib/server-startup";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to start system services
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    initializeServerServices();
    
    return NextResponse.json({
      success: true,
      message: "Server services started successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error starting server services:", error);
    return NextResponse.json(
      { error: "Failed to start server services" },
      { status: 500 }
    );
  }
}
