import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { RegisterFormData } from "@/types/auth"

export async function POST(request: NextRequest) {
  try {
    const body: RegisterFormData = await request.json()
    const { firstName, lastName, email, password, department, role } = body

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

    // Create audit log
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

    return NextResponse.json(
      { 
        message: "User created successfully",
        user 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
