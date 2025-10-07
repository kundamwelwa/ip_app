/**
 * Equipment management utilities for import/export operations
 */

import { MiningEquipment } from "@/types/equipment";

export interface EquipmentImportData {
  name: string;
  type: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  ipAddress: string;
  macAddress: string;
  location: string;
  operator: string;
  notes?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

/**
 * Validates equipment data for import
 */
export function validateEquipmentData(data: EquipmentImportData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push("Equipment name is required");
  }

  if (!data.type?.trim()) {
    errors.push("Equipment type is required");
  }

  if (!data.model?.trim()) {
    errors.push("Model is required");
  }

  if (!data.manufacturer?.trim()) {
    errors.push("Manufacturer is required");
  }

  if (!data.serialNumber?.trim()) {
    errors.push("Serial number is required");
  }

  if (!data.ipAddress?.trim()) {
    errors.push("IP address is required");
  } else if (!isValidIPAddress(data.ipAddress)) {
    errors.push("Invalid IP address format");
  }

  if (!data.macAddress?.trim()) {
    errors.push("MAC address is required");
  } else if (!isValidMACAddress(data.macAddress)) {
    errors.push("Invalid MAC address format");
  }

  if (!data.location?.trim()) {
    errors.push("Location is required");
  }

  if (!data.operator?.trim()) {
    errors.push("Operator is required");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates IP address format
 */
function isValidIPAddress(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

/**
 * Validates MAC address format
 */
function isValidMACAddress(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

/**
 * Converts equipment data to CSV format
 */
export function exportToCSV(equipment: MiningEquipment[]): string {
  const headers = [
    "ID",
    "Name",
    "Type",
    "Model",
    "Manufacturer",
    "Serial Number",
    "IP Address",
    "MAC Address",
    "Status",
    "Location",
    "Operator",
    "Operating Hours",
    "Fuel Level",
    "Last Maintenance",
    "Next Maintenance",
    "Notes",
    "Created At",
    "Updated At"
  ];

  const rows = equipment.map(item => [
    item.id,
    item.name,
    item.type,
    item.model,
    item.manufacturer,
    item.serialNumber,
    item.ipAddress,
    item.macAddress,
    item.status,
    item.location,
    item.operator,
    item.operatingHours.toString(),
    item.fuelLevel.toString(),
    item.lastMaintenance.toISOString().split('T')[0],
    item.nextMaintenance.toISOString().split('T')[0],
    item.notes,
    item.createdAt.toISOString().split('T')[0],
    item.updatedAt.toISOString().split('T')[0]
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Parses CSV data to equipment import format
 */
export function parseCSVToEquipment(csvContent: string): EquipmentImportData[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data: EquipmentImportData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    
    if (values.length >= headers.length) {
      const equipment: EquipmentImportData = {
        name: values[0] || '',
        type: values[1] || '',
        model: values[2] || '',
        manufacturer: values[3] || '',
        serialNumber: values[4] || '',
        ipAddress: values[5] || '',
        macAddress: values[6] || '',
        location: values[7] || '',
        operator: values[8] || '',
        notes: values[9] || ''
      };
      data.push(equipment);
    }
  }

  return data;
}

/**
 * Downloads CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'equipment-export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Reads file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * Generates equipment ID
 */
export function generateEquipmentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `EQ${timestamp}${random}`.toUpperCase();
}

/**
 * Converts import data to equipment object
 */
export function convertImportDataToEquipment(data: EquipmentImportData): Omit<MiningEquipment, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: data.name,
    type: data.type as MiningEquipment['type'],
    model: data.model,
    manufacturer: data.manufacturer,
    serialNumber: data.serialNumber,
    ipAddress: data.ipAddress,
    macAddress: data.macAddress,
    status: 'offline' as const, // Default status for imported equipment
    location: data.location,
    operator: data.operator,
    lastMaintenance: new Date(),
    nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    operatingHours: 0,
    fuelLevel: 0,
    notes: data.notes || ''
  };
}

/**
 * Validates equipment type
 */
export function isValidEquipmentType(type: string): boolean {
  const validTypes = ["Truck", "Excavator", "Drill", "Loader", "Dozer", "Shovel", "Crusher", "Conveyor"];
  return validTypes.includes(type);
}

/**
 * Gets equipment type options
 */
export function getEquipmentTypeOptions(): string[] {
  return ["Truck", "Excavator", "Drill", "Loader", "Dozer", "Shovel", "Crusher", "Conveyor"];
}

/**
 * Gets manufacturer options
 */
export function getManufacturerOptions(): string[] {
  return ["Caterpillar", "Komatsu", "Liebherr", "Hitachi", "Volvo", "John Deere", "Case", "JCB"];
}
