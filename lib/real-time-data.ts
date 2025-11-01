/**
 * Real-time data processing and aggregation utilities
 */

import { getTimeAgo, calculateUptime, formatUptimeDuration } from './time-utils';

export interface RealTimeEquipmentData {
  id: string;
  name: string;
  type: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'UNKNOWN';
  location: string;
  lastSeen: Date | null;
  meshStrength: number;
  nodeId: string | null;
  ip: string;
  ipStatus: string;
  operator?: string;
  assignedBy?: string;
  // Real-time data
  isOnline: boolean;
  responseTime?: number;
  uptime: number;
  signalStrength: number;
  lastSeenFormatted: string;
  timeAgo: string;
  statusColor: string;
}

export interface RealTimeNetworkStats {
  totalNodes: number;
  activeNodes: number;
  meshStrength: number;
  bandwidth: string;
  latency: number;
  uptime: number;
  uptimeFormatted: string;
  averageResponseTime: number;
  totalDataRate: number;
  networkHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface EquipmentCommunicationData {
  equipmentId: string;
  ipAddress: string;
  isOnline: boolean;
  responseTime?: number;
  lastSeen: Date;
  error?: string;
}

/**
 * Process equipment data with real-time information
 */
export function processEquipmentData(
  equipment: {
    id: string;
    name: string;
    type: string;
    status: string;
    location: string | null;
    lastSeen: Date | null;
    meshStrength: number | null;
    nodeId: string | null;
    ip: string;
    ipStatus: string;
    operator?: string | null;
    assignedBy?: string | null;
  }[],
  realTimeStatuses: EquipmentCommunicationData[]
): RealTimeEquipmentData[] {
  return equipment.map(eq => {
    const realTimeStatus = realTimeStatuses.find(status => status.equipmentId === eq.id);
    const isOnline = realTimeStatus ? realTimeStatus.isOnline : eq.status === 'ONLINE';
    const responseTime = realTimeStatus?.responseTime;
    const lastSeen = realTimeStatus ? realTimeStatus.lastSeen : (eq.lastSeen ? new Date(eq.lastSeen) : null);
    
    const uptime = calculateUptime(lastSeen);
    const timeAgo = getTimeAgo(lastSeen);
    
    // Calculate signal strength based on real-time data or mesh strength
    const signalStrength = realTimeStatus ? 
      Math.max(0, 100 - (responseTime || 0) / 10) : // Estimate signal strength from response time
      eq.meshStrength || 0;

    return {
      id: eq.id,
      name: eq.name,
      type: eq.type,
      status: eq.status as 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'UNKNOWN',
      location: eq.location || 'Unknown',
      lastSeen,
      meshStrength: eq.meshStrength || 0,
      nodeId: eq.nodeId,
      ip: eq.ip || 'Not assigned',
      ipStatus: eq.ipStatus || 'AVAILABLE',
      operator: eq.operator || undefined,
      assignedBy: eq.assignedBy || undefined,
      // Real-time data
      isOnline,
      responseTime,
      uptime,
      signalStrength: Math.min(100, Math.max(0, signalStrength)),
      lastSeenFormatted: lastSeen ? lastSeen.toLocaleString() : 'Never',
      timeAgo: timeAgo.fullText,
      statusColor: isOnline ? 'text-green-600' : 'text-red-600'
    };
  });
}

/**
 * Calculate real-time network statistics
 */
export function calculateNetworkStats(
  equipment: RealTimeEquipmentData[],
  baseStats: {
    totalNodes: number;
    activeNodes: number;
    meshStrength: number;
    bandwidth: string;
    latency: number;
    uptime: number;
  }
): RealTimeNetworkStats {
  const onlineEquipment = equipment.filter(eq => eq.isOnline);
  const totalEquipment = equipment.length;
  
  // Calculate average response time
  const responseTimes = equipment
    .filter(eq => eq.responseTime !== undefined)
    .map(eq => eq.responseTime!);
  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0;

  // Calculate average uptime
  const uptimes = equipment.map(eq => eq.uptime);
  const averageUptime = uptimes.length > 0 
    ? uptimes.reduce((sum, uptime) => sum + uptime, 0) / uptimes.length 
    : 0;

  // Calculate total data rate (simulate based on equipment type and status)
  const totalDataRate = equipment.reduce((sum, eq) => {
    if (eq.isOnline) {
      // Simulate data rate based on equipment type
      const baseRate = getBaseDataRate(eq.type);
      const signalFactor = eq.signalStrength / 100;
      return sum + (baseRate * signalFactor);
    }
    return sum;
  }, 0);

  // Calculate network health
  const uptimePercentage = totalEquipment > 0 ? (onlineEquipment.length / totalEquipment) * 100 : 0;
  const averageSignalStrength = onlineEquipment.length > 0 
    ? onlineEquipment.reduce((sum, eq) => sum + eq.signalStrength, 0) / onlineEquipment.length 
    : 0;

  let networkHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  if (uptimePercentage >= 95 && averageSignalStrength >= 80) {
    networkHealth = 'excellent';
  } else if (uptimePercentage >= 85 && averageSignalStrength >= 60) {
    networkHealth = 'good';
  } else if (uptimePercentage >= 70 && averageSignalStrength >= 40) {
    networkHealth = 'fair';
  }

  return {
    totalNodes: baseStats.totalNodes || totalEquipment,
    activeNodes: onlineEquipment.length,
    meshStrength: baseStats.meshStrength || averageSignalStrength,
    bandwidth: baseStats.bandwidth || '2.4 Gbps',
    latency: Math.round(averageResponseTime),
    uptime: averageUptime,
    uptimeFormatted: formatUptimeDuration(averageUptime * 24 * 60 * 60 * 1000), // Convert to ms
    averageResponseTime: Math.round(averageResponseTime),
    totalDataRate: Math.round(totalDataRate),
    networkHealth
  };
}

/**
 * Get base data rate for equipment type
 */
function getBaseDataRate(equipmentType: string): number {
  const rates: Record<string, number> = {
    'TRUCK': 45,
    'EXCAVATOR': 50,
    'DRILL': 40,
    'LOADER': 35,
    'DOZER': 30,
    'RAJANT_NODE': 60,
    'SHOVEL': 45,
    'CRUSHER': 40,
    'CONVEYOR': 25,
    'COMPUTER': 20,
    'SERVER': 30,
    'PRINTER': 5,
    'ROUTER': 50,
    'SWITCH': 40,
    'FIREWALL': 25,
    'OTHER': 15
  };
  
  return rates[equipmentType.toUpperCase()] || 20;
}

/**
 * Get network health color
 */
export function getNetworkHealthColor(health: string): string {
  switch (health) {
    case 'excellent':
      return 'text-green-600';
    case 'good':
      return 'text-blue-600';
    case 'fair':
      return 'text-yellow-600';
    case 'poor':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get signal strength color
 */
export function getSignalStrengthColor(strength: number): string {
  if (strength >= 80) return 'text-green-600';
  if (strength >= 60) return 'text-yellow-600';
  if (strength >= 40) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get uptime color
 */
export function getUptimeColor(uptime: number): string {
  if (uptime >= 95) return 'text-green-600';
  if (uptime >= 85) return 'text-yellow-600';
  if (uptime >= 70) return 'text-orange-600';
  return 'text-red-600';
}
