import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { RegisterFormData } from "@/types/auth"

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body: RegisterFormData = await request.json()
    const { firstName, lastName, email, password, department, role } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !department || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    console.log("Registration attempt for:", email)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        department,
        role: role as "ADMIN" | "MANAGER" | "TECHNICIAN",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        role: true,
        createdAt: true,
      }
    })

    // Create audit log (non-blocking - don't fail registration if this fails)
    try {
      await prisma.auditLog.create({
        data: {
          action: "USER_REGISTERED",
          entityType: "USER",
          entityId: user.id,
          userId: user.id,
          details: {
            email: user.email,
            role: user.role,
            department: user.department,
          }
        }
      })
    } catch (auditError) {
      // Log the error but don't fail the registration
      console.error("Failed to create audit log:", auditError)
    }

    return NextResponse.json(
      { 
        message: "User created successfully",
        user 
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Registration error:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    
    // Check for specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Database constraint violation" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
