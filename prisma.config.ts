import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // Use the direct (non-pooled) Supabase URL for CLI commands (migrate, introspect)
    // The pooled DATABASE_URL is passed to PrismaClient at runtime in lib/prisma.ts
    url: process.env.DIRECT_URL,
  },

  migrations: {
    // Seed command (replaces the deprecated package.json `prisma.seed`)
    seed: `tsx ${path.join("prisma", "seed.ts")}`,
  },
});
