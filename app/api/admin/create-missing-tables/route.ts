import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create missing reports and report_templates tables

export async function POST() {
  try {
    console.log('Creating missing tables...');
    
    // Create reports table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'GENERATING',
        "format" TEXT NOT NULL DEFAULT 'pdf',
        "fileSize" TEXT,
        "downloadUrl" TEXT,
        "parameters" JSONB,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "completedAt" TIMESTAMP(3),
        "failedAt" TIMESTAMP(3),
        CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ reports table created');
    
    // Create report_templates table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "report_templates" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "parameters" JSONB NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "estimatedTime" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ report_templates table created');
    
    // Add foreign key constraint
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT IF NOT EXISTS "reports_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    console.log('✅ Foreign key constraint added');
    
    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "reports_userId_idx" ON "reports"("userId");
      CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports"("status");
      CREATE INDEX IF NOT EXISTS "reports_type_idx" ON "reports"("type");
      CREATE INDEX IF NOT EXISTS "reports_createdAt_idx" ON "reports"("createdAt");
      CREATE INDEX IF NOT EXISTS "report_templates_category_idx" ON "report_templates"("category");
      CREATE INDEX IF NOT EXISTS "report_templates_isActive_idx" ON "report_templates"("isActive");
    `);
    console.log('✅ Indexes created');
    
    return NextResponse.json({
      success: true,
      message: 'Missing tables created successfully',
      tables: ['reports', 'report_templates']
    });

  } catch (error: any) {
    console.error('Failed to create tables:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

