/*
  Warnings:

  - Added the required column `title` to the `alerts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AlertStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'APPROVED', 'REJECTED', 'RESOLVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AlertType" ADD VALUE 'EQUIPMENT_ADDED';
ALTER TYPE "public"."AlertType" ADD VALUE 'EQUIPMENT_UPDATED';
ALTER TYPE "public"."AlertType" ADD VALUE 'EQUIPMENT_DELETED';
ALTER TYPE "public"."AlertType" ADD VALUE 'IP_ASSIGNED';
ALTER TYPE "public"."AlertType" ADD VALUE 'IP_UNASSIGNED';
ALTER TYPE "public"."AlertType" ADD VALUE 'IP_ADDRESS_ADDED';
ALTER TYPE "public"."AlertType" ADD VALUE 'IP_ADDRESS_UPDATED';
ALTER TYPE "public"."AlertType" ADD VALUE 'IP_ADDRESS_DELETED';
ALTER TYPE "public"."AlertType" ADD VALUE 'USER_CREATED';
ALTER TYPE "public"."AlertType" ADD VALUE 'USER_UPDATED';
ALTER TYPE "public"."AlertType" ADD VALUE 'USER_DELETED';
ALTER TYPE "public"."AlertType" ADD VALUE 'CONFIG_CHANGED';

-- Update existing alerts to have a default title
UPDATE "public"."alerts" SET "message" = COALESCE("message", 'Legacy system alert') WHERE "message" IS NULL OR "message" = '';

-- AlterTable
ALTER TABLE "public"."alerts" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "acknowledgedBy" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "resolutionNote" TEXT,
ADD COLUMN     "status" "public"."AlertStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Legacy Alert';

-- Update existing alerts with proper titles based on their type
UPDATE "public"."alerts" 
SET "title" = CASE 
  WHEN "type" = 'EQUIPMENT_OFFLINE' THEN 'Equipment Offline'
  WHEN "type" = 'IP_CONFLICT' THEN 'IP Conflict Detected'
  WHEN "type" = 'MESH_WEAK_SIGNAL' THEN 'Weak Mesh Signal'
  WHEN "type" = 'MAINTENANCE_REQUIRED' THEN 'Maintenance Required'
  WHEN "type" = 'NETWORK_DISCONNECTION' THEN 'Network Disconnection'
  WHEN "type" = 'SECURITY_BREACH' THEN 'Security Breach'
  WHEN "type" = 'SYSTEM_ERROR' THEN 'System Error'
  ELSE 'System Alert'
END
WHERE "title" = 'Legacy Alert';

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_acknowledgedBy_fkey" FOREIGN KEY ("acknowledgedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
