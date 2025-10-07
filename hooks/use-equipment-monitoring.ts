import { useState, useEffect, useCallback } from "react";

export interface EquipmentStatus {
  equipmentId: string;
  ipAddress: string;
  isOnline: boolean;
  responseTime?: number;
  lastSeen: Date;
  error?: string;
}

export interface MonitoringStatus {
  isRunning: boolean;
  intervalMs?: number;
}

export function useEquipmentMonitoring() {
  const [equipmentStatuses, setEquipmentStatuses] = useState<EquipmentStatus[]>([]);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus>({ isRunning: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check all equipment status
  const checkAllEquipment = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/equipment/communication?checkAll=true");
      if (!response.ok) {
        throw new Error("Failed to check equipment status");
      }
      
      const data = await response.json();
      if (data.success) {
        setEquipmentStatuses(data.results);
      } else {
        throw new Error(data.error || "Failed to check equipment status");
      }
    } catch (err) {
      console.error("Error checking equipment status:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check specific equipment status
  const checkEquipment = useCallback(async (equipmentId: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/equipment/communication?equipmentId=${equipmentId}`);
      if (!response.ok) {
        throw new Error("Failed to check equipment status");
      }
      
      const data = await response.json();
      if (data.success) {
        // Update the specific equipment status in the list
        setEquipmentStatuses(prev => {
          const filtered = prev.filter(eq => eq.equipmentId !== equipmentId);
          return [...filtered, data.result];
        });
        return data.result;
      } else {
        throw new Error(data.error || "Failed to check equipment status");
      }
    } catch (err) {
      console.error("Error checking equipment status:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  // Get monitoring status
  const getMonitoringStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/equipment/monitor");
      if (!response.ok) {
        throw new Error("Failed to get monitoring status");
      }
      
      const data = await response.json();
      if (data.success) {
        setMonitoringStatus(data.status);
      } else {
        console.warn("Failed to get monitoring status:", data.error);
        // Set default status if we can't get the current status
        setMonitoringStatus({ isRunning: false });
      }
    } catch (err) {
      console.error("Error getting monitoring status:", err);
      // Set default status on error
      setMonitoringStatus({ isRunning: false });
    }
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(async (intervalMs: number = 30000) => {
    try {
      setError(null);
      
      const response = await fetch("/api/equipment/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          intervalMs
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to start monitoring");
      }
      
      const data = await response.json();
      if (data.success) {
        setMonitoringStatus({ isRunning: true, intervalMs });
        return true;
      } else {
        // If monitor is already running, update the status instead of throwing an error
        if (data.message && data.message.includes("already running")) {
          console.log("Monitor is already running, updating status");
          setMonitoringStatus({ isRunning: true, intervalMs });
          return true;
        }
        throw new Error(data.message || "Failed to start monitoring");
      }
    } catch (err) {
      console.error("Error starting monitoring:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  // Stop monitoring
  const stopMonitoring = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch("/api/equipment/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "stop"
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to stop monitoring");
      }
      
      const data = await response.json();
      if (data.success) {
        setMonitoringStatus({ isRunning: false });
        return true;
      } else {
        throw new Error(data.message || "Failed to stop monitoring");
      }
    } catch (err) {
      console.error("Error stopping monitoring:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  // Restart monitoring
  const restartMonitoring = useCallback(async (intervalMs: number = 30000) => {
    try {
      setError(null);
      
      const response = await fetch("/api/equipment/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "restart",
          intervalMs
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to restart monitoring");
      }
      
      const data = await response.json();
      if (data.success) {
        setMonitoringStatus({ isRunning: true, intervalMs });
        return true;
      } else {
        throw new Error(data.message || "Failed to restart monitoring");
      }
    } catch (err) {
      console.error("Error restarting monitoring:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  // Get equipment status by ID
  const getEquipmentStatus = useCallback((equipmentId: string) => {
    return equipmentStatuses.find(eq => eq.equipmentId === equipmentId);
  }, [equipmentStatuses]);

  // Get online equipment count
  const getOnlineCount = useCallback(() => {
    return equipmentStatuses.filter(eq => eq.isOnline).length;
  }, [equipmentStatuses]);

  // Get offline equipment count
  const getOfflineCount = useCallback(() => {
    return equipmentStatuses.filter(eq => !eq.isOnline).length;
  }, [equipmentStatuses]);

  // Load initial data
  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        // First get the current monitoring status
        await getMonitoringStatus();
        // Then check equipment status
        await checkAllEquipment();
      } catch (error) {
        console.error("Error initializing monitoring:", error);
      }
    };

    initializeMonitoring();
  }, [checkAllEquipment, getMonitoringStatus]);

  return {
    equipmentStatuses,
    monitoringStatus,
    isLoading,
    error,
    checkAllEquipment,
    checkEquipment,
    getMonitoringStatus,
    startMonitoring,
    stopMonitoring,
    restartMonitoring,
    getEquipmentStatus,
    getOnlineCount,
    getOfflineCount,
  };
}
