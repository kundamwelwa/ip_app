import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/templates - Fetch all report templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.reportTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    const formattedTemplates = templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      parameters: template.parameters,
      isDefault: template.isDefault,
      estimatedTime: template.estimatedTime,
    }));

    return NextResponse.json({ templates: formattedTemplates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/reports/templates - Create a new report template (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, category, parameters, isDefault, estimatedTime } = body;

    const template = await prisma.reportTemplate.create({
      data: {
        name,
        description,
        type,
        category,
        parameters,
        isDefault: isDefault || false,
        estimatedTime,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

