import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Please set it in your environment variables or .env file.'
  )
}


function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Create Prisma Client with optimized settings for serverless
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Store the client globally in all environments to prevent multiple instances
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

// Gracefully disconnect on serverless function end
if (process.env.NODE_ENV === 'production') {
  // For serverless, we want to reuse connections but handle cleanup
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
