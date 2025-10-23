import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runDataConsistencyCheck } from "@/lib/data-consistency";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to run consistency checks
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can run consistency checks" },
        { status: 403 }
      );
    }

    // Run the consistency check
    const results = await runDataConsistencyCheck();

    return NextResponse.json({
      success: true,
      message: "Data consistency check completed",
      results,
    });
  } catch (error) {
    console.error("Error running consistency check:", error);
    return NextResponse.json(
      { error: "Failed to run consistency check" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      message: "Data consistency check endpoint",
      description: "POST to this endpoint to run a comprehensive data consistency check",
      checks: [
        "Auto-resolve alerts for online equipment",
        "Sync equipment statuses",
        "Sync IP address statuses",
        "Cleanup old assignments (90+ days)",
        "Cleanup old resolved alerts (30+ days)",
      ],
    });
  } catch (error) {
    console.error("Error getting consistency check info:", error);
    return NextResponse.json(
      { error: "Failed to get consistency check info" },
      { status: 500 }
    );
  }
}

