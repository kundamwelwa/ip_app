import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// A secure, hardcoded reset key specifically for disaster recovery and system resets
const MASTER_RESET_KEY = "8a2f5c76dbb314ab896e3846d5c19024f8d9101b1eaff9a7b0ebabaec5d3e020";

export async function POST(request: NextRequest) {
  try {
    const { resetKey } = await request.json();

    if (!resetKey || resetKey !== MASTER_RESET_KEY) {
      // In a real production scenario, you would implement rate limiting here
      // to prevent brute forcing of this endpoint.
      console.warn("Unauthorized attempt to reset system bootstrap state");
      
      // Simulate generic delay to mitigate timing attacks
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return NextResponse.json(
        { error: "Invalid master reset key provided." },
        { status: 403 }
      );
    }

    // Attempt to reset the system flag in the database
    await prisma.systemSettings.update({
      where: { id: "global" },
      data: { isBootstrapped: false },
    });

    // We do NOT wipe the database here, only the state that allows the
    // registration endpoint to accept the BOOTSTRAP_TOKEN again.

    return NextResponse.json({ 
      message: "System bootstrap state has been successfully reset. You can now register a new Super Admin."
    });
  } catch (error) {
    console.error("System reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset system configuration. Internal database error." },
      { status: 500 }
    );
  }
}
