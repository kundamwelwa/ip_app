import { prisma } from "@/lib/prisma";
import { checkAllEquipmentStatus } from "@/lib/equipment-communication";

export interface NetworkStatsData {
  totalNodes: number;
  activeNodes: number;
  meshStrength: number;
  bandwidth: string;
  latency: number;
  uptime: number;
}

/**
 * Record current network statistics to the database
 */
export async function recordNetworkStats(): Promise<NetworkStatsData> {
  try {
    // Get real-time equipment status
    const realTimeStatuses = await checkAllEquipmentStatus();

    // Get all equipment with mesh data
    const equipment = await prisma.equipment.findMany({
      where: {
        status: "ONLINE",
        meshStrength: { not: null },
      },
      select: {
        id: true,
        status: true,
        meshStrength: true,
        type: true,
      },
    });

    // Calculate statistics
    const totalNodes = await prisma.equipment.count();
    const activeNodes = realTimeStatuses.filter(status => status.isOnline).length;

    // Calculate average mesh strength from online equipment
    const onlineEquipment = equipment.filter(eq => {
      const realTimeStatus = realTimeStatuses.find(status => status.equipmentId === eq.id);
      return realTimeStatus ? realTimeStatus.isOnline : eq.status === "ONLINE";
    });

    const averageMeshStrength = onlineEquipment.length > 0
      ? Math.round(
          onlineEquipment.reduce((sum, eq) => sum + (eq.meshStrength || 0), 0) /
          onlineEquipment.length
        )
      : 0;

    // Calculate total data rate based on real network performance
    const totalDataRate = realTimeStatuses.reduce((sum, status) => {
      if (status.isOnline) {
        const baseRate = 25; // Minimum rate in Mbps
        const performanceFactor = status.responseTime ? Math.max(0, 1 - (status.responseTime / 100)) : 1;
        return sum + (baseRate + (performanceFactor * 35)); // 25-60 Mbps range per device
      }
      return sum;
    }, 0);

    // Calculate average latency using real ping results
    const responseTimes = realTimeStatuses
      .filter(status => status.isOnline && status.responseTime)
      .map(status => status.responseTime!);
    
    const averageLatency = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 12; // Default fallback

    // Calculate network uptime percentage
    const uptimePercentage = totalNodes > 0 
      ? parseFloat(((activeNodes / totalNodes) * 100).toFixed(1))
      : 100.0;

    // Format bandwidth
    const bandwidth = totalDataRate >= 1000 
      ? `${(totalDataRate / 1000).toFixed(1)} Gbps` 
      : `${Math.round(totalDataRate)} Mbps`;

    // Create network stats record
    const networkStats = await prisma.networkStats.create({
      data: {
        totalNodes,
        activeNodes,
        meshStrength: averageMeshStrength,
        bandwidth,
        latency: averageLatency,
        uptime: uptimePercentage,
        recordedAt: new Date(),
      },
    });

    return {
      totalNodes: networkStats.totalNodes,
      activeNodes: networkStats.activeNodes,
      meshStrength: networkStats.meshStrength,
      bandwidth: networkStats.bandwidth || bandwidth,
      latency: networkStats.latency || averageLatency,
      uptime: networkStats.uptime,
    };
  } catch (error) {
    console.error("Error recording network stats:", error);
    throw new Error(`Failed to record network statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get network statistics for a specific time range
 */
export async function getNetworkStatsHistory(
  startDate: Date,
  endDate: Date
): Promise<NetworkStatsData[]> {
  try {
    const stats = await prisma.networkStats.findMany({
      where: {
        recordedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        recordedAt: "asc",
      },
    });

    return stats.map(stat => ({
      totalNodes: stat.totalNodes,
      activeNodes: stat.activeNodes,
      meshStrength: stat.meshStrength,
      bandwidth: stat.bandwidth || "N/A",
      latency: stat.latency || 0,
      uptime: stat.uptime,
    }));
  } catch (error) {
    console.error("Error fetching network stats history:", error);
    throw new Error(`Failed to fetch network statistics history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get latest network statistics
 */
export async function getLatestNetworkStats(): Promise<NetworkStatsData | null> {
  try {
    const latestStats = await prisma.networkStats.findFirst({
      orderBy: {
        recordedAt: "desc",
      },
    });

    if (!latestStats) {
      return null;
    }

    return {
      totalNodes: latestStats.totalNodes,
      activeNodes: latestStats.activeNodes,
      meshStrength: latestStats.meshStrength,
      bandwidth: latestStats.bandwidth || "N/A",
      latency: latestStats.latency || 0,
      uptime: latestStats.uptime,
    };
  } catch (error) {
    console.error("Error fetching latest network stats:", error);
    return null;
  }
}

/**
 * Clean up old network statistics (keep last 90 days)
 */
export async function cleanupOldNetworkStats(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.networkStats.deleteMany({
      where: {
        recordedAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old network statistics records`);
    return result.count;
  } catch (error) {
    console.error("Error cleaning up old network stats:", error);
    return 0;
  }
}

/**
 * Start periodic network stats recording (for background service)
 * @param intervalMs - Interval in milliseconds (default: 5 minutes)
 */
export function startNetworkStatsRecording(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
  console.log(`Starting network stats recording service with ${intervalMs}ms interval`);
  
  // Record stats immediately
  recordNetworkStats().catch(err => 
    console.error("Error in initial network stats recording:", err)
  );
  
  // Then set up interval for periodic recording
  return setInterval(async () => {
    try {
      console.log("Recording network statistics...");
      await recordNetworkStats();
      console.log("Network statistics recorded successfully");
    } catch (error) {
      console.error("Error in periodic network stats recording:", error);
    }
  }, intervalMs);
}

/**
 * Stop periodic network stats recording
 */
export function stopNetworkStatsRecording(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log("Network stats recording service stopped");
}

