import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Received body:", JSON.stringify(body, null, 2))
    
    // Test 1: Can we query the database?
    const userCount = await prisma.user.count()
    console.log("Current user count:", userCount)
    
    // Test 2: Can we create a simple user without bcrypt?
    const testUser = await prisma.user.create({
      data: {
        firstName: "Test",
        lastName: "User",
        email: `test${Date.now()}@test.com`,
        password: "plaintext", // We'll test bcrypt separately
        department: "Test",
        role: "ADMIN",
      }
    })
    
    console.log("User created:", testUser.id)
    
    return NextResponse.json({
      success: true,
      message: "Test user created successfully",
      userId: testUser.id,
      userCount: userCount + 1
    })
  } catch (error: any) {
    console.error("Test registration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 5),
      },
      { status: 500 }
    )
  }
}

