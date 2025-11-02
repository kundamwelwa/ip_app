import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/[id]/download - Download a report file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Report is not ready for download" },
        { status: 400 }
      );
    }

    // TODO: In production, fetch the file from cloud storage (S3, Azure Blob, etc.)
    // For now, return a mock PDF
    const mockPDFContent = `
    %PDF-1.4
    1 0 obj
    << /Type /Catalog /Pages 2 0 R >>
    endobj
    2 0 obj
    << /Type /Pages /Count 1 /Kids [3 0 R] >>
    endobj
    3 0 obj
    << /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
    endobj
    4 0 obj
    << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
    endobj
    5 0 obj
    << /Length 44 >>
    stream
    BT
    /F1 12 Tf
    100 700 Td
    (${report.name}) Tj
    ET
    endstream
    endobj
    xref
    0 6
    0000000000 65535 f
    0000000009 00000 n
    0000000056 00000 n
    0000000115 00000 n
    0000000214 00000 n
    0000000304 00000 n
    trailer
    << /Size 6 /Root 1 0 R >>
    startxref
    398
    %%EOF
    `;

    const buffer = Buffer.from(mockPDFContent);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report.name.replace(/\s/g, "_")}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json(
      { error: "Failed to download report" },
      { status: 500 }
    );
  }
}

