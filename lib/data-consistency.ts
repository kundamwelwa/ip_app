import { prisma } from "@/lib/prisma";

/**
 * Auto-resolve equipment offline alerts when equipment comes back online
 */
export async function autoResolveEquipmentAlerts(equipmentId: string, userId?: string): Promise<number> {
  try {
    // Get the equipment to check its current status
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      select: { status: true },
    });

    if (!equipment || equipment.status !== "ONLINE") {
      return 0;
    }

    // Find unresolved alerts for this equipment
    const unresolvedAlerts = await prisma.alert.findMany({
      where: {
        equipmentId,
        isResolved: false,
        type: {
          in: ["EQUIPMENT_OFFLINE", "NETWORK_DISCONNECTION", "MESH_WEAK_SIGNAL"],
        },
      },
    });

    if (unresolvedAlerts.length === 0) {
      return 0;
    }

    // Resolve all equipment-related alerts
    const now = new Date();
    await Promise.all(
      unresolvedAlerts.map((alert) =>
        prisma.alert.update({
          where: { id: alert.id },
          data: {
            isResolved: true,
            resolvedAt: now,
            resolvedBy: userId || null,
          },
        })
      )
    );

    console.log(`Auto-resolved ${unresolvedAlerts.length} alerts for equipment ${equipmentId}`);
    return unresolvedAlerts.length;
  } catch (error) {
    console.error(`Error auto-resolving alerts for equipment ${equipmentId}:`, error);
    return 0;
  }
}

/**
 * Sync equipment status based on IP assignment and connectivity
 */
export async function syncEquipmentStatus(equipmentId: string): Promise<boolean> {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        ipAssignments: {
          where: { isActive: true },
        },
      },
    });

    if (!equipment) {
      return false;
    }

    // If equipment has no IP assignment and is marked ONLINE, it shouldn't be
    if (equipment.ipAssignments.length === 0 && equipment.status === "ONLINE") {
      await prisma.equipment.update({
        where: { id: equipmentId },
        data: {
          status: "OFFLINE",
        },
      });
      
      console.log(`Synced equipment ${equipmentId} status to OFFLINE (no IP assignment)`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error syncing equipment status for ${equipmentId}:`, error);
    return false;
  }
}

/**
 * Ensure IP address status matches its assignment state
 */
export async function syncIPAddressStatus(ipAddressId: string): Promise<boolean> {
  try {
    const ipAddress = await prisma.iPAddress.findUnique({
      where: { id: ipAddressId },
      include: {
        assignments: {
          where: { isActive: true },
        },
      },
    });

    if (!ipAddress) {
      return false;
    }

    const hasActiveAssignments = ipAddress.assignments.length > 0;
    const currentStatus = ipAddress.status;

    // Determine correct status
    let correctStatus: "AVAILABLE" | "ASSIGNED" | "RESERVED" | "OFFLINE";
    
    if (ipAddress.isReserved) {
      correctStatus = "RESERVED";
    } else if (hasActiveAssignments) {
      correctStatus = "ASSIGNED";
    } else {
      correctStatus = "AVAILABLE";
    }

    // Update if status is incorrect
    if (currentStatus !== correctStatus) {
      await prisma.iPAddress.update({
        where: { id: ipAddressId },
        data: { status: correctStatus },
      });

      console.log(`Synced IP ${ipAddress.address} status from ${currentStatus} to ${correctStatus}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error syncing IP address status for ${ipAddressId}:`, error);
    return false;
  }
}

/**
 * Clean up old inactive assignments (older than specified days)
 */
export async function cleanupOldAssignments(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.iPAssignment.deleteMany({
      where: {
        isActive: false,
        releasedAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old inactive assignments`);
    return result.count;
  } catch (error) {
    console.error("Error cleaning up old assignments:", error);
    return 0;
  }
}

/**
 * Clean up old resolved alerts (older than specified days)
 */
export async function cleanupOldAlerts(daysToKeep: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.alert.deleteMany({
      where: {
        isResolved: true,
        resolvedAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old resolved alerts`);
    return result.count;
  } catch (error) {
    console.error("Error cleaning up old alerts:", error);
    return 0;
  }
}

/**
 * Run comprehensive data consistency check and fix
 */
export async function runDataConsistencyCheck(): Promise<{
  alertsResolved: number;
  equipmentSynced: number;
  ipsSynced: number;
  assignmentsCleaned: number;
  alertsCleaned: number;
}> {
  console.log("Starting data consistency check...");

  const results = {
    alertsResolved: 0,
    equipmentSynced: 0,
    ipsSynced: 0,
    assignmentsCleaned: 0,
    alertsCleaned: 0,
  };

  try {
    // 1. Auto-resolve alerts for online equipment
    const onlineEquipment = await prisma.equipment.findMany({
      where: { status: "ONLINE" },
      select: { id: true },
    });

    for (const equipment of onlineEquipment) {
      const resolved = await autoResolveEquipmentAlerts(equipment.id);
      results.alertsResolved += resolved;
    }

    // 2. Sync equipment statuses
    const allEquipment = await prisma.equipment.findMany({
      select: { id: true },
    });

    for (const equipment of allEquipment) {
      const synced = await syncEquipmentStatus(equipment.id);
      if (synced) results.equipmentSynced++;
    }

    // 3. Sync IP address statuses
    const allIPs = await prisma.iPAddress.findMany({
      select: { id: true },
    });

    for (const ip of allIPs) {
      const synced = await syncIPAddressStatus(ip.id);
      if (synced) results.ipsSynced++;
    }

    // 4. Cleanup old data
    results.assignmentsCleaned = await cleanupOldAssignments(90);
    results.alertsCleaned = await cleanupOldAlerts(30);

    console.log("Data consistency check completed:", results);
    return results;
  } catch (error) {
    console.error("Error running data consistency check:", error);
    return results;
  }
}

/**
 * Create alert for equipment that goes offline
 */
export async function createEquipmentOfflineAlert(
  equipmentId: string,
  message: string,
  severity: "LOW" | "INFO" | "WARNING" | "ERROR" | "CRITICAL" = "ERROR"
): Promise<string | null> {
  try {
    // Check if there's already an unresolved offline alert for this equipment
    const existingAlert = await prisma.alert.findFirst({
      where: {
        equipmentId,
        type: "EQUIPMENT_OFFLINE",
        isResolved: false,
      },
    });

    if (existingAlert) {
      // Alert already exists, don't create duplicate
      return existingAlert.id;
    }

    // Create new alert
    const alert = await prisma.alert.create({
      data: {
        type: "EQUIPMENT_OFFLINE",
        severity,
        message,
        equipmentId,
        isResolved: false,
      },
    });

    console.log(`Created offline alert for equipment ${equipmentId}`);
    return alert.id;
  } catch (error) {
    console.error(`Error creating offline alert for equipment ${equipmentId}:`, error);
    return null;
  }
}

/**
 * Create alert for weak mesh signal
 */
export async function createWeakSignalAlert(
  equipmentId: string,
  signalStrength: number
): Promise<string | null> {
  try {
    // Check if there's already an unresolved weak signal alert for this equipment
    const existingAlert = await prisma.alert.findFirst({
      where: {
        equipmentId,
        type: "MESH_WEAK_SIGNAL",
        isResolved: false,
      },
    });

    if (existingAlert) {
      return existingAlert.id;
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      select: { name: true },
    });

    const alert = await prisma.alert.create({
      data: {
        type: "MESH_WEAK_SIGNAL",
        severity: signalStrength < 30 ? "ERROR" : "WARNING",
        message: `Weak mesh signal detected on ${equipment?.name || "equipment"}: ${signalStrength}%`,
        equipmentId,
        isResolved: false,
      },
    });

    console.log(`Created weak signal alert for equipment ${equipmentId}`);
    return alert.id;
  } catch (error) {
    console.error(`Error creating weak signal alert for equipment ${equipmentId}:`, error);
    return null;
  }
}

