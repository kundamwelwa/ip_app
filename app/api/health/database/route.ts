import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Check if tables exist by trying to count records
    const userCount = await prisma.user.count();
    const ipCount = await prisma.iPAddress.count();
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      tables: {
        users: userCount,
        ipAddresses: ipCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Database health check failed:", error);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message,
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

