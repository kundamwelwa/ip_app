import { startEquipmentMonitor, isEquipmentMonitorRunning } from "./equipment-monitor";

/**
 * Initialize server-side services
 * This should be called when the server starts up
 */
export function initializeServerServices() {
  console.log("Initializing server services...");
  
  // Only start equipment monitoring if it's not already running
  if (!isEquipmentMonitorRunning()) {
    console.log("Starting equipment monitoring...");
    startEquipmentMonitor(30000);
  } else {
    console.log("Equipment monitoring is already running, skipping startup");
  }
  
  console.log("Server services initialized successfully");
}

/**
 * Cleanup server services
 * This should be called when the server shuts down
 */
export function cleanupServerServices() {
  console.log("Cleaning up server services...");
  
  // The monitoring service will be cleaned up automatically
  // when the process exits
  
  console.log("Server services cleaned up");
}
