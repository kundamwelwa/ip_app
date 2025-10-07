import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        operator: true,
        location: true,
        status: true
      }
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    return NextResponse.json({ equipment });

  } catch (error) {
    console.error("Error fetching equipment operator:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment operator" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { operator } = body;

    if (!operator) {
      return NextResponse.json(
        { error: "Operator is required" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.update({
      where: { id: params.id },
      data: { operator },
      select: {
        id: true,
        name: true,
        operator: true,
        location: true,
        status: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      equipment,
      message: `Operator updated to ${operator}`
    });

  } catch (error) {
    console.error("Error updating equipment operator:", error);
    return NextResponse.json(
      { error: "Failed to update equipment operator" },
      { status: 500 }
    );
  }
}
