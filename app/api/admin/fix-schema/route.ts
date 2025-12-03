import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Quick fix to add missing phoneNumber and profilePicture columns

export async function POST() {
  try {
    console.log('Adding missing columns to users table...');
    
    // Add phoneNumber column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
      `);
      console.log('✅ phoneNumber column added');
    } catch (e: any) {
      console.log('phoneNumber column might already exist:', e.message);
    }
    
    // Add profilePicture column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "profilePicture" TEXT;
      `);
      console.log('✅ profilePicture column added');
    } catch (e: any) {
      console.log('profilePicture column might already exist:', e.message);
    }
    
    // Verify columns exist
    const tableInfo = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    return NextResponse.json({
      success: true,
      message: 'Schema fix applied successfully',
      columns: tableInfo
    });

  } catch (error: any) {
    console.error('Schema fix failed:', error);
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

