import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// IMPORTANT: This endpoint syncs the Prisma schema to the database
// Use this to fix schema mismatches

export async function POST() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        { error: 'This endpoint only runs in production' },
        { status: 403 }
      );
    }

    console.log('Starting schema sync...');
    
    // Use db push to sync schema without migrations
    const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate --accept-data-loss');
    
    console.log('Schema sync output:', stdout);
    if (stderr) {
      console.error('Schema sync stderr:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema synced successfully',
      output: stdout,
      stderr: stderr || 'No errors'
    });

  } catch (error: any) {
    console.error('Schema sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      },
      { status: 500 }
    );
  }
}

