import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// IMPORTANT: Delete this file after running migrations!
// This is a temporary endpoint for initial database setup

export async function GET() {
  try {
    // Check if this is being run in production
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        { error: 'This endpoint only runs in production' },
        { status: 403 }
      );
    }

    console.log('Starting database migration...');
    
    // Run Prisma migrations
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    console.log('Migration output:', stdout);
    if (stderr) {
      console.error('Migration stderr:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Database migrations completed successfully',
      output: stdout,
      stderr: stderr || 'No errors'
    });

  } catch (error: any) {
    console.error('Migration failed:', error);
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

