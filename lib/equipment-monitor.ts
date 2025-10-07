import { startEquipmentMonitoring, stopEquipmentMonitoring } from "./equipment-communication";

let monitoringInterval: NodeJS.Timeout | null = null;

/**
 * Start the equipment monitoring background service
 */
export function startEquipmentMonitor(intervalMs: number = 30000): void {
  if (monitoringInterval) {
    console.log("Equipment monitor is already running");
    return;
  }

  console.log(`Starting equipment monitor with ${intervalMs}ms interval`);
  monitoringInterval = startEquipmentMonitoring(intervalMs);
}

/**
 * Stop the equipment monitoring background service
 */
export function stopEquipmentMonitor(): void {
  if (monitoringInterval) {
    stopEquipmentMonitoring(monitoringInterval);
    monitoringInterval = null;
    console.log("Equipment monitor stopped");
  } else {
    console.log("Equipment monitor is not running");
  }
}

/**
 * Check if equipment monitor is running
 */
export function isEquipmentMonitorRunning(): boolean {
  return monitoringInterval !== null;
}

/**
 * Get monitoring status
 */
export function getMonitoringStatus(): {
  isRunning: boolean;
  intervalMs?: number;
} {
  return {
    isRunning: isEquipmentMonitorRunning(),
    intervalMs: monitoringInterval ? 30000 : undefined
  };
}
