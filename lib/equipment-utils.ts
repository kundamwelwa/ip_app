/**
 * Equipment management utilities for import/export operations
 */

import { MiningEquipment } from "@/types/equipment";
import * as XLSX from 'xlsx';

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

  // Model, Manufacturer, Serial Number are optional for import
  // if (!data.model?.trim()) {
  //   errors.push("Model is required");
  // }

  // if (!data.manufacturer?.trim()) {
  //   errors.push("Manufacturer is required");
  // }

  // if (!data.serialNumber?.trim()) {
  //   errors.push("Serial number is required");
  // }

  if (!data.ipAddress?.trim()) {
    errors.push("IP address is required");
  } else if (!isValidIPAddress(data.ipAddress)) {
    errors.push("Invalid IP address format");
  }

  // MAC Address is optional but must be valid if provided
  if (data.macAddress?.trim() && !isValidMACAddress(data.macAddress)) {
    errors.push("Invalid MAC address format");
  }

  // Location and Operator are optional
  // if (!data.location?.trim()) {
  //   errors.push("Location is required");
  // }

  // if (!data.operator?.trim()) {
  //   errors.push("Operator is required");
  // }

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
    item.serialNumber || '',
    item.ipAddress || '',
    item.macAddress,
    item.status,
    item.location || '',
    item.operator || '',
    item.operatingHours?.toString() || '0',
    item.fuelLevel?.toString() || '0',
    item.lastMaintenance ? item.lastMaintenance.toISOString().split('T')[0] : '',
    item.nextMaintenance ? item.nextMaintenance.toISOString().split('T')[0] : '',
    item.notes || '',
    item.createdAt.toISOString().split('T')[0],
    item.updatedAt.toISOString().split('T')[0]
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Parses CSV data to equipment import format with proper quote handling
 */
export function parseCSVToEquipment(csvContent: string): EquipmentImportData[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const data: EquipmentImportData[] = [];

  // Parse CSV line with proper quote handling
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Handle escaped quotes
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length >= 8) { // At least 8 required fields
      const equipment: EquipmentImportData = {
        name: values[0] || '',
        type: values[1] || '',
        model: values[2] || '',
        manufacturer: values[3] || '',
        macAddress: values[4] || '',
        serialNumber: values[5] || '',
        ipAddress: '', // IP will be assigned later
        location: values[6] || '',
        operator: values[7] || '',
        notes: values[8] || ''
      };
      data.push(equipment);
    }
  }

  return data;
}

/**
 * Parses Excel data to equipment import format
 */
export async function parseExcelToEquipment(file: File): Promise<EquipmentImportData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 1) {
          resolve([]);
          return;
        }

        const firstRow = jsonData[0] as any[];

        // Check if this is the IP Recon Matrix format (first row contains IP addresses)
        const isReconFormat = firstRow.some((cell: any) =>
          typeof cell === 'string' && isValidIPAddress(cell)
        );

        if (isReconFormat) {
          const equipmentData: EquipmentImportData[] = [];

          // Iterate through all rows
          jsonData.forEach((row: any) => {
            if (!Array.isArray(row)) return;

            // Iterate through columns in pairs (IP, Description)
            for (let i = 0; i < row.length; i += 2) {
              const ip = row[i];
              const description = row[i + 1];

              if (typeof ip === 'string' && isValidIPAddress(ip) && description && typeof description === 'string') {
                // Filter out non-equipment entries
                const descLower = description.toLowerCase();
                const ignoreTerms = ['gateway', 'ha ip', 'reserved', 'not in use', 'spare', 'available', 'network', 'broadcast', 'dhcp', 'free'];

                if (ignoreTerms.some(term => descLower.includes(term))) {
                  continue;
                }

                // Infer type from description
                let type = 'OTHER';
                if (descLower.includes('rajant')) type = 'RAJANT_NODE';
                else if (descLower.startsWith('fd')) type = 'DRILL';
                else if (descLower.startsWith('ex')) type = 'EXCAVATOR';
                else if (descLower.startsWith('tr')) type = 'TRUCK';
                else if (descLower.startsWith('dz')) type = 'DOZER';
                else if (descLower.startsWith('ld')) type = 'LOADER';
                else if (descLower.startsWith('sh')) type = 'SHOVEL';
                else if (descLower.includes('crusher')) type = 'CRUSHER';
                else if (descLower.includes('conveyor')) type = 'CONVEYOR';

                equipmentData.push({
                  name: description,
                  type: type,
                  model: '',
                  manufacturer: '',
                  serialNumber: '', // Will need to be generated or filled
                  ipAddress: ip,
                  macAddress: '', // Will need to be generated or filled
                  location: '',
                  operator: '',
                  notes: 'Imported from IP Recon'
                });
              }
            }
          });

          resolve(equipmentData);
          return;
        }

        // Standard Header Format Parsing
        if (jsonData.length < 2) {
          resolve([]);
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => h?.toString().toLowerCase() || '');
        const rows = jsonData.slice(1) as any[];

        const equipmentData = rows.map((row) => {
          // Helper to find value by header name (fuzzy match)
          const getValue = (keywords: string[]) => {
            const index = headers.findIndex(h => keywords.some(k => h.includes(k)));
            return index !== -1 ? (row[index]?.toString() || '') : '';
          };

          const name = getValue(['name', 'equipment']);

          // Skip empty rows
          if (!name) return null;

          return {
            name: name,
            type: getValue(['type', 'category']),
            model: getValue(['model']),
            manufacturer: getValue(['manufacturer', 'make', 'brand']),
            serialNumber: getValue(['serial', 'sn']),
            ipAddress: getValue(['ip', 'address']),
            macAddress: getValue(['mac']),
            location: getValue(['location', 'area', 'site']),
            operator: getValue(['operator', 'driver']),
            notes: getValue(['notes', 'description', 'comment'])
          } as EquipmentImportData;
        }).filter((item): item is EquipmentImportData => item !== null);

        resolve(equipmentData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Exports equipment data to Excel file
 */
export function exportToExcel(equipment: MiningEquipment[], filename: string = 'equipment-export.xlsx'): void {
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
    item.serialNumber || '',
    item.ipAddress || '',
    item.macAddress,
    item.status,
    item.location || '',
    item.operator || '',
    item.operatingHours?.toString() || '0',
    item.fuelLevel?.toString() || '0',
    item.lastMaintenance ? item.lastMaintenance.toISOString().split('T')[0] : '',
    item.nextMaintenance ? item.nextMaintenance.toISOString().split('T')[0] : '',
    item.notes || '',
    item.createdAt.toISOString().split('T')[0],
    item.updatedAt.toISOString().split('T')[0]
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment");

  XLSX.writeFile(workbook, filename);
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
    ipAddress: data.ipAddress || '',
    macAddress: data.macAddress,
    status: 'OFFLINE' as const, // Default status for imported equipment
    location: data.location,
    operator: data.operator,
    description: data.notes || null,
    notes: data.notes || null,
    lastSeen: null,
    meshStrength: null,
    nodeId: null,
    lastMaintenance: undefined,
    nextMaintenance: undefined,
    operatingHours: undefined,
    fuelLevel: undefined
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
