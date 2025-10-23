import { prisma } from "@/lib/prisma";
import { exec } from "child_process";
import { promisify } from "util";
import {
  autoResolveEquipmentAlerts,
  createEquipmentOfflineAlert,
  createWeakSignalAlert,
} from "@/lib/data-consistency";

const execAsync = promisify(exec);

export interface EquipmentCommunicationResult {
  equipmentId: string;
  ipAddress: string;
  isOnline: boolean;
  responseTime?: number;
  lastSeen: Date;
  error?: string;
}

export interface EquipmentHeartbeat {
  equipmentId: string;
  ipAddress: string;
  meshStrength: number;
  dataRate: number;
  temperature?: number;
  fuelLevel?: number;
  location?: string;
  timestamp: Date;
}

/**
 * Ping an IP address to check if equipment is reachable
 */
export async function pingEquipment(ipAddress: string, timeout: number = 5000): Promise<{
  isOnline: boolean;
  responseTime?: number;
  error?: string;
}> {
  try {
    // Use ping command based on OS
    const isWindows = process.platform === "win32";
    const pingCommand = isWindows 
      ? `ping -n 1 -w ${timeout} ${ipAddress}`
      : `ping -c 1 -W ${Math.ceil(timeout / 1000)} ${ipAddress}`;

    const { stdout, stderr } = await execAsync(pingCommand);
    
    if (stderr) {
      return { isOnline: false, error: stderr };
    }

    // Parse response time from ping output
    const responseTimeMatch = stdout.match(/time[<=](\d+)ms/i) || 
                             stdout.match(/time=(\d+\.?\d*)/i);
    
    const responseTime = responseTimeMatch ? 
      parseFloat(responseTimeMatch[1]) : undefined;

    // Check if ping was successful
    const isOnline = stdout.includes("Reply from") || 
                     stdout.includes("64 bytes from") ||
                     stdout.includes("PING") && !stdout.includes("100% packet loss");

    return { isOnline, responseTime };
  } catch (error) {
    return { 
      isOnline: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Check equipment connectivity and update status
 */
export async function checkEquipmentStatus(equipmentId: string): Promise<EquipmentCommunicationResult> {
  try {
    // Get equipment with IP assignment
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        ipAssignments: {
          where: { isActive: true },
          include: {
            ipAddress: true
          }
        }
      }
    });

    if (!equipment) {
      throw new Error(`Equipment with ID ${equipmentId} not found`);
    }

    const activeAssignment = equipment.ipAssignments[0];
    if (!activeAssignment) {
      // No IP assignment, mark as offline
      await prisma.equipment.update({
        where: { id: equipmentId },
        data: { 
          status: "OFFLINE",
          lastSeen: new Date()
        }
      });

      return {
        equipmentId,
        ipAddress: "N/A",
        isOnline: false,
        lastSeen: new Date(),
        error: "No IP address assigned"
      };
    }

    const ipAddress = activeAssignment.ipAddress.address;
    const pingResult = await pingEquipment(ipAddress);

    // Update equipment status based on ping result
    const newStatus = pingResult.isOnline ? "ONLINE" : "OFFLINE";
    const lastSeen = pingResult.isOnline ? new Date() : (equipment.lastSeen || new Date());
    const calculatedMeshStrength = pingResult.isOnline ? 
      Math.max(0, 100 - (pingResult.responseTime || 0) / 10) : 
      equipment.meshStrength;

    await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        status: newStatus,
        lastSeen,
        meshStrength: calculatedMeshStrength
      }
    });

    // Handle status changes and alerts
    if (equipment.status !== newStatus) {
      try {
        // Try to find a system user or create one if it doesn't exist
        let systemUser = await prisma.user.findFirst({
          where: { email: "system@mining.local" }
        });

        if (!systemUser) {
          systemUser = await prisma.user.create({
            data: {
              firstName: "System",
              lastName: "User",
              email: "system@mining.local",
              password: "system", // This won't be used for authentication
              department: "SYSTEM",
              role: "ADMIN"
            }
          });
        }

        // Create audit log for status change
        await prisma.auditLog.create({
          data: {
            action: "EQUIPMENT_STATUS_CHANGED",
            entityType: "EQUIPMENT",
            entityId: equipmentId,
            userId: systemUser.id,
            equipmentId: equipmentId,
            details: {
              oldStatus: equipment.status,
              newStatus: newStatus,
              ipAddress: ipAddress,
              responseTime: pingResult.responseTime
            }
          }
        });

        // Handle alert creation/resolution
        if (newStatus === "OFFLINE") {
          // Create offline alert
          await createEquipmentOfflineAlert(
            equipmentId,
            `Equipment ${equipment.name} is offline`,
            "ERROR"
          );
        } else if (newStatus === "ONLINE") {
          // Auto-resolve offline alerts
          await autoResolveEquipmentAlerts(equipmentId, systemUser.id);
        }
      } catch (auditError) {
        console.warn("Failed to create audit log or handle alerts:", auditError);
        // Continue execution even if audit/alert operations fail
      }
    }

    // Check for weak mesh signal and create alert if needed
    if (pingResult.isOnline && calculatedMeshStrength < 50) {
      await createWeakSignalAlert(equipmentId, calculatedMeshStrength);
    }

    return {
      equipmentId,
      ipAddress,
      isOnline: pingResult.isOnline,
      responseTime: pingResult.responseTime,
      lastSeen,
      error: pingResult.error
    };

  } catch (error) {
    console.error(`Error checking equipment ${equipmentId}:`, error);
    
    // Mark equipment as offline on error
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { 
        status: "OFFLINE",
        lastSeen: new Date()
      }
    });

    return {
      equipmentId,
      ipAddress: "Unknown",
      isOnline: false,
      lastSeen: new Date(),
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Check all equipment statuses
 */
export async function checkAllEquipmentStatus(): Promise<EquipmentCommunicationResult[]> {
  try {
    // Get all equipment with active IP assignments
    const equipment = await prisma.equipment.findMany({
      include: {
        ipAssignments: {
          where: { isActive: true },
          include: {
            ipAddress: true
          }
        }
      }
    });

    const results: EquipmentCommunicationResult[] = [];

    // Check each equipment in parallel (with some concurrency limit)
    const batchSize = 10;
    for (let i = 0; i < equipment.length; i += batchSize) {
      const batch = equipment.slice(i, i + batchSize);
      const batchPromises = batch.map(eq => checkEquipmentStatus(eq.id));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  } catch (error) {
    console.error("Error checking all equipment status:", error);
    return [];
  }
}

/**
 * Process equipment heartbeat
 */
export async function processEquipmentHeartbeat(heartbeat: EquipmentHeartbeat): Promise<boolean> {
  try {
    // Update equipment with heartbeat data
    await prisma.equipment.update({
      where: { id: heartbeat.equipmentId },
      data: {
        status: "ONLINE",
        lastSeen: heartbeat.timestamp,
        meshStrength: heartbeat.meshStrength,
        location: heartbeat.location || undefined,
        // Update other fields if provided
        ...(heartbeat.temperature && { /* temperature field if exists in schema */ }),
        ...(heartbeat.fuelLevel && { /* fuelLevel field if exists in schema */ })
      }
    });

    // Log the heartbeat
    try {
      // Try to find a system user or create one if it doesn't exist
      let systemUser = await prisma.user.findFirst({
        where: { email: "system@mining.local" }
      });

      if (!systemUser) {
        systemUser = await prisma.user.create({
          data: {
            firstName: "System",
            lastName: "User",
            email: "system@mining.local",
            password: "system", // This won't be used for authentication
            department: "SYSTEM",
            role: "ADMIN"
          }
        });
      }

      await prisma.auditLog.create({
        data: {
          action: "EQUIPMENT_HEARTBEAT",
          entityType: "EQUIPMENT",
          entityId: heartbeat.equipmentId,
          userId: systemUser.id,
          equipmentId: heartbeat.equipmentId,
          details: {
            ipAddress: heartbeat.ipAddress,
            meshStrength: heartbeat.meshStrength,
            dataRate: heartbeat.dataRate,
            temperature: heartbeat.temperature,
            fuelLevel: heartbeat.fuelLevel
          }
        }
      });
    } catch (auditError) {
      console.warn("Failed to create audit log for heartbeat:", auditError);
      // Continue execution even if audit log creation fails
    }

    return true;
  } catch (error) {
    console.error(`Error processing heartbeat for equipment ${heartbeat.equipmentId}:`, error);
    return false;
  }
}

/**
 * Get equipment communication status
 */
export async function getEquipmentCommunicationStatus(equipmentId: string): Promise<{
  isOnline: boolean;
  lastSeen: Date | null;
  responseTime?: number;
  meshStrength?: number;
  ipAddress?: string;
}> {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        ipAssignments: {
          where: { isActive: true },
          include: {
            ipAddress: true
          }
        }
      }
    });

    if (!equipment) {
      throw new Error(`Equipment with ID ${equipmentId} not found`);
    }

    const activeAssignment = equipment.ipAssignments[0];
    const ipAddress = activeAssignment?.ipAddress.address;

    return {
      isOnline: equipment.status === "ONLINE",
      lastSeen: equipment.lastSeen,
      responseTime: equipment.status === "ONLINE" ? 
        Math.max(1, 100 - (equipment.meshStrength || 0)) : undefined,
      meshStrength: equipment.meshStrength || undefined,
      ipAddress
    };
  } catch (error) {
    console.error(`Error getting communication status for equipment ${equipmentId}:`, error);
    return {
      isOnline: false,
      lastSeen: null
    };
  }
}

/**
 * Start equipment monitoring service
 */
export function startEquipmentMonitoring(intervalMs: number = 30000): NodeJS.Timeout {
  console.log(`Starting equipment monitoring service with ${intervalMs}ms interval`);
  
  return setInterval(async () => {
    try {
      console.log("Running equipment status check...");
      const results = await checkAllEquipmentStatus();
      
      const onlineCount = results.filter(r => r.isOnline).length;
      const offlineCount = results.length - onlineCount;
      
      console.log(`Equipment status check completed: ${onlineCount} online, ${offlineCount} offline`);
    } catch (error) {
      console.error("Error in equipment monitoring service:", error);
    }
  }, intervalMs);
}

/**
 * Stop equipment monitoring service
 */
export function stopEquipmentMonitoring(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log("Equipment monitoring service stopped");
}
