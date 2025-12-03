import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma Client with optimized settings for serverless
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Optimize for serverless environments
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

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
