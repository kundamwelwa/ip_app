import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// IMPORTANT: Delete this file after running migrations!
// This is a temporary endpoint for initial database setup

export async function GET() {
  let migrationsApplied: string[] = [];
  
  try {
    // Allow in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_MIGRATE !== 'true') {
      return NextResponse.json(
        {error: 'This endpoint only runs in production',
          env: process.env.NODE_ENV,
          hint: 'Set ENABLE_MIGRATE=true to run in other environments'
        },
        { status: 403 }
      );
    }

    console.log('Starting database migration...');
    
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
      
      // Create migrations table if it doesn't exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
          "id" VARCHAR(36) PRIMARY KEY,
          "checksum" VARCHAR(64) NOT NULL,
          "finished_at" TIMESTAMPTZ,
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMPTZ,
          "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        );
      `);
      
      // Get list of already applied migrations
      const appliedMigrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL;
      `;
      
      const appliedNames = new Set(appliedMigrations.map(m => m.migration_name));
      
      // Read migration files from the migrations directory
      const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
      const migrationFolders = fs.readdirSync(migrationsDir)
        .filter(name => !name.startsWith('.'))
        .sort();
      
      for (const folder of migrationFolders) {
        if (appliedNames.has(folder)) {
          console.log(`Skipping already applied migration: ${folder}`);
          continue;
        }
        
        const migrationFile = path.join(migrationsDir, folder, 'migration.sql');
        if (!fs.existsSync(migrationFile)) {
          console.log(`No migration.sql found in ${folder}, skipping`);
          continue;
        }
        
        const sql = fs.readFileSync(migrationFile, 'utf-8');
        console.log(`Applying migration: ${folder}`);
        
        // Split SQL into individual statements and execute them
        // Remove comments and split by semicolons
        const statements = sql
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        for (const statement of statements) {
          if (statement) {
            await prisma.$executeRawUnsafe(statement);
          }
        }
        
        // Record the migration
        const migrationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await prisma.$executeRawUnsafe(`
          INSERT INTO "_prisma_migrations" (id, checksum, migration_name, logs, started_at, finished_at, applied_steps_count)
          VALUES ($1, $2, $3, $4, now(), now(), 1);
        `, migrationId, '', folder, `Applied via API at ${new Date().toISOString()}`);
        
        migrationsApplied.push(folder);
        console.log(`Successfully applied: ${folder}`);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Database migrations completed successfully',
        migrationsApplied,
        totalApplied: migrationsApplied.length
      });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        migrationsApplied
      },
      { status: 500 }
    );
  }
}

