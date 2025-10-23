-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('NETWORK_DISCONNECTION', 'EQUIPMENT_OFFLINE', 'IP_CONFLICT', 'MESH_WEAK_SIGNAL', 'SYSTEM_ERROR', 'MAINTENANCE_REQUIRED', 'SECURITY_BREACH', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('LOW', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."EquipmentType" ADD VALUE 'TRUCK';
ALTER TYPE "public"."EquipmentType" ADD VALUE 'EXCAVATOR';
ALTER TYPE "public"."EquipmentType" ADD VALUE 'DRILL';
ALTER TYPE "public"."EquipmentType" ADD VALUE 'LOADER';
ALTER TYPE "public"."EquipmentType" ADD VALUE 'DOZER';
ALTER TYPE "public"."EquipmentType" ADD VALUE 'SHOVEL';
ALTER TYPE "public"."EquipmentType" ADD VALUE 'CRUSHER';
ALTER TYPE "public"."EquipmentType" ADD VALUE 'CONVEYOR';
ALTER TYPE "public"."EquipmentType" ADD VALUE 'RAJANT_NODE';

-- AlterTable
ALTER TABLE "public"."equipment" ADD COLUMN     "lastSeen" TIMESTAMP(3),
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "meshStrength" INTEGER,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "nodeId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "operator" TEXT;

-- CreateTable
CREATE TABLE "public"."network_stats" (
    "id" TEXT NOT NULL,
    "totalNodes" INTEGER NOT NULL DEFAULT 0,
    "activeNodes" INTEGER NOT NULL DEFAULT 0,
    "meshStrength" INTEGER NOT NULL DEFAULT 0,
    "bandwidth" TEXT,
    "latency" INTEGER,
    "uptime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "network_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" TEXT NOT NULL,
    "type" "public"."AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL DEFAULT 'INFO',
    "equipmentId" TEXT,
    "ipAddressId" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_ipAddressId_fkey" FOREIGN KEY ("ipAddressId") REFERENCES "public"."ip_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
