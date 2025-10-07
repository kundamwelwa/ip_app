/**
 * Equipment type definitions
 */

export interface MiningEquipment {
  id: string;
  name: string;
  type: "Truck" | "Excavator" | "Drill" | "Loader" | "Dozer" | "Shovel" | "Crusher" | "Conveyor";
  model: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  ipAddress: string;
  macAddress: string | null;
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE" | "UNKNOWN";
  location: string | null;
  operator: string | null;
  description: string | null;
  notes: string | null;
  lastSeen: Date | null;
  meshStrength: number | null;
  nodeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  // IP assignments from the API
  ipAssignments?: Array<{
    id: string;
    isActive: boolean;
    assignedAt: Date;
    ipAddress: {
      id: string;
      address: string;
      status: string;
    };
  }>;

  lastMaintenance?: Date;
  nextMaintenance?: Date;
  operatingHours?: number;
  fuelLevel?: number;
}

export interface EquipmentFormData {
  name: string;
  type: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  ipAddress: string;
  macAddress: string;
  location: string;
  operator: string;
  notes: string;
  status: string;
}

export interface EquipmentFilter {
  search: string;
  type: string;
  status: string;
  location: string;
  operator: string;
}

export interface EquipmentStats {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
  idle: number;
  byType: Record<string, number>;
  byLocation: Record<string, number>;
}

export interface IPaddressStats  {
  total: number;
  assigned: number;
  unassigned: number;
  notes: string;
  
}