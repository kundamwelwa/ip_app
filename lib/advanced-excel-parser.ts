/**
 * Advanced Excel Parser for Import/Export System
 * Handles multi-sheet detection, smart mapping, and complex table structures
 */

import * as XLSX from 'xlsx';
import {
  SheetInfo,
  ParsedEquipmentData,
  GroupedEquipment,
  ExcelParseResult,
  DuplicateInFile,
} from '@/components/import-export/types';

type CellValue = string | number | boolean | Date | null | undefined;
type RowValue = CellValue[];
type SheetData = RowValue[];

const RESERVED_KEYWORDS = [
  'reserved',
  'not in use',
  'not in-use',
  'not-in-use',
  'unused',
  'available',
  'spare',
  'free',
  'tbd',
  'n/a',
  'na',
];

/**
 * Validates IP address format
 */
export function isValidIPAddress(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip.trim());
}

/**
 * Detects all sheets in an Excel workbook
 */
export async function detectSheets(file: File): Promise<SheetInfo[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });

        const sheets: SheetInfo[] = workbook.SheetNames.map((name) => {
          const worksheet = workbook.Sheets[name];
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

          const rowCount = range.e.r - range.s.r + 1;
          const columnCount = range.e.c - range.s.c + 1;

          // Check if sheet has actual data (not just headers)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const hasData = jsonData.length > 1;

          return {
            name,
            rowCount,
            columnCount,
            hasData,
          };
        });

        resolve(sheets);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses Excel sheet with intelligent structure detection
 * Handles the format: MACHINE_ID | SYSTEM | IP_ADDRESS | SUBNET_MASK | GATEWAY | COMMENTS
 */
export async function parseExcelSheet(
  file: File,
  sheetName?: string
): Promise<ExcelParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });

        // Use first sheet if no sheet name specified
        const targetSheet = sheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[targetSheet];

        if (!worksheet) {
          reject(new Error(`Sheet "${targetSheet}" not found`));
          return;
        }

        // Convert to JSON array
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false
        }) as SheetData;

        console.log('📊 Excel Parse Debug:', {
          sheetName: targetSheet,
          totalRows: jsonData.length,
          firstRow: jsonData[0],
          sampleData: jsonData.slice(0, 3)
        });

        if (jsonData.length < 1) {
          resolve({
            data: [],
            totalRows: 0,
            totalIPs: 0,
            duplicateIPs: [],
          });
          return;
        }

        // Detect column structure
        const headerRow = jsonData[0] ?? [];
        const initialColumnMap = detectColumnStructure(headerRow);
        const hasHeader = Object.values(initialColumnMap).some(idx => idx !== -1);

        // Optimize IP Column Detection:
        // Scan data to find the column with the most UNIQUE IPs usually indicates the primary IP column
        // This prevents selecting "Gateway" or "Server IP" columns which often have repeated values
        const ipColumnStats = new Map<number, Set<string>>();
        const dataRowsToCheck = jsonData.slice(hasHeader ? 1 : 0, Math.min(jsonData.length, 100)); // Check first 100 rows

        dataRowsToCheck.forEach((row) => {
          row.forEach((cell, index) => {
            const val = toStringValue(cell).trim();
            if (isValidIPAddress(val)) {
              if (!ipColumnStats.has(index)) {
                ipColumnStats.set(index, new Set());
              }
              ipColumnStats.get(index)!.add(val);
            }
          });
        });

        // Find column with most unique IPs
        let bestIpCol = initialColumnMap.ipAddress;
        let maxUnique = 0;

        // Check currently mapped column first
        if (ipColumnStats.has(bestIpCol)) {
          maxUnique = ipColumnStats.get(bestIpCol)!.size;
        }

        ipColumnStats.forEach((uniqueIps, colIndex) => {
          // If this column has significantly more unique IPs, it's likely the real IP column
          // Or if no IP column was detected (-1), this is a candidate
          if (uniqueIps.size > maxUnique) {
            maxUnique = uniqueIps.size;
            bestIpCol = colIndex;
          }
        });

        // Update map if we found a better column (and it's not the machine ID column, to avoid confusing ID for IP)
        if (bestIpCol !== -1 && bestIpCol !== initialColumnMap.machineId) {
          initialColumnMap.ipAddress = bestIpCol;
        }

        const columnMap = initialColumnMap;
        console.log('🔍 Optimized Column Mapping:', columnMap);

        // Parse data rows
        const parsedData: ParsedEquipmentData[] = [];
        const seenIPs = new Set<string>();
        const ipFirstSeen = new Map<string, { row: number; machineId: string; system: string }>();
        const duplicateMap = new Map<string, DuplicateInFile>();
        const startRow = hasHeader ? 1 : 0;

        // Capture headers for system naming
        const headers = hasHeader && headerRow ? headerRow.map((h) => toStringValue(h).trim()) : [];

        for (let rowIndex = startRow; rowIndex < jsonData.length; rowIndex++) {
          const row = jsonData[rowIndex];

          // Skip empty rows
          if (!row || row.every((cell) => toStringValue(cell).trim() === '')) {
            continue;
          }

          let ipsFoundInRow = 0;

          // STRICT COLUMN-BASED LOGIC: Scan all columns for IPs
          row.forEach((cell, colIndex) => {
            const cellValue = toStringValue(cell).trim();
            if (isValidIPAddress(cellValue)) {
              // 1. Determine System Name (Category) based on column header
              let systemName = 'UNKNOWN';
              if (headers[colIndex] && !isHeaderValue(headers[colIndex])) {
                const header = headers[colIndex];
                // Clean up header (e.g. "DSS IP Address" -> "DSS")
                if (!header.toLowerCase().includes('address') && !header.toLowerCase().includes('ip')) {
                  systemName = header;
                } else {
                  const cleaned = header.replace(/ip\s?address/i, '').replace(/ip/i, '').trim();
                  if (cleaned && cleaned.length > 2) systemName = cleaned;
                  else if (cleaned.length === 0) systemName = 'General';
                }
              }

              // 2. Determine Assignment based on Adjacent Cell (Right Neighbor)
              const adjacentCellIndex = colIndex + 1;
              const adjacentRaw = row[adjacentCellIndex];
              const adjacentValue =
                adjacentRaw === null || adjacentRaw === undefined ? '' : adjacentRaw.toString();
              const adjacentTrimmed = adjacentValue.trim();

              let status: 'ASSIGNED' | 'AVAILABLE' | 'RESERVED' = 'ASSIGNED';
              const machineId = adjacentValue; // Preserve exactly as written (no placeholders)
              const normalizedAdjacent = adjacentTrimmed.toLowerCase();
              const adjacentIsIP = isValidIPAddress(adjacentTrimmed);
              const adjacentMatchesIP =
                adjacentIsIP && normalizeIPAddress(adjacentTrimmed) === normalizeIPAddress(cellValue);
              const isReservedKeyword = RESERVED_KEYWORDS.some((keyword) => normalizedAdjacent.includes(keyword));

              if (adjacentTrimmed === '' || adjacentTrimmed === '-' || adjacentIsIP || adjacentMatchesIP || isReservedKeyword) {
                status = 'RESERVED';
              } else {
                status = 'ASSIGNED';
              }

              const normalizedIP = normalizeIPAddress(cellValue);
              if (!seenIPs.has(normalizedIP)) {
                seenIPs.add(normalizedIP);
                ipFirstSeen.set(normalizedIP, { row: rowIndex + 1, machineId, system: systemName });

                parsedData.push({
                  machineId: machineId,
                  system: systemName,
                  ipAddress: cellValue,
                  subnet: '255.255.255.0', // Default, unless we scan specific subnet columns (omitted for strict logic)
                  gateway: '',             // Default
                  comments: '',            // Default
                  status: status,
                  rowIndex,
                });
                ipsFoundInRow++;
              } else {
                // Handle duplicate
                const existing = duplicateMap.get(normalizedIP);
                const occurrence = { row: rowIndex + 1, machineId, system: systemName };
                if (existing) {
                  existing.occurrences.push(occurrence);
                } else {
                  const first = ipFirstSeen.get(normalizedIP);
                  duplicateMap.set(normalizedIP, {
                    ipAddress: normalizedIP,
                    occurrences: [...(first ? [first] : []), occurrence]
                  });
                }
              }
            }
          });

          if (ipsFoundInRow === 0) {
            // Optional: Log skipped row if relevant, but with this strict logic, 
            // rows without IPs are just ignored.
          }
        }

        console.log('✅ Parsing Results:', {
          totalParsed: parsedData.length,
          uniqueIPs: seenIPs.size,
          duplicates: duplicateMap.size,
        });

        // Group by machine ID (For ASSIGNED only, others grouping is less relevant but structure is needed)
        const grouped = groupByMachineId(parsedData);

        resolve({
          data: grouped,
          totalRows: parsedData.length,
          totalIPs: seenIPs.size,
          duplicateIPs: Array.from(duplicateMap.values()),
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Detects column structure - Deprecated in new strict mode but kept for header helpers
 */
function detectColumnStructure(headerRow: RowValue): {
  machineId: number;
  system: number;
  ipAddress: number;
  subnet: number;
  gateway: number;
  comments: number;
} {
  void headerRow;
  return {
    machineId: -1, system: -1, ipAddress: -1, subnet: -1, gateway: -1, comments: -1
  }
}

/**
 * Checks if a cell value looks like a header label rather than actual data
 */
function isHeaderValue(value: string): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  const headerTerms = ['machine id', 'machine', 'system', 'ip address', 'subnet', 'gateway', 'comments', 'device'];
  return headerTerms.some(term => normalized === term || normalized.includes('ip address'));
}

function normalizeIPAddress(ip: string): string {
  const trimmed = ip.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 4) return trimmed;
  return parts.map((part) => String(Number(part))).join('.');
}

function toStringValue(value: CellValue): string {
  if (value === null || value === undefined) return '';
  return value.toString();
}

/**
 * Groups parsed data by machine ID
 */
function groupByMachineId(data: ParsedEquipmentData[]): GroupedEquipment[] {
  const grouped = new Map<string, GroupedEquipment>();

  data.forEach((item) => {
    const normalizedIP = normalizeIPAddress(item.ipAddress);
    const isAssigned = item.status === 'ASSIGNED';
    const groupKey = isAssigned
      ? `assigned:${item.machineId}`
      : `unassigned:${normalizedIP}`;

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        groupKey,
        machineId: item.machineId,
        systems: [],
      });
    }

    grouped.get(groupKey)!.systems.push({
      system: item.system,
      ipAddress: item.ipAddress,
      subnet: item.subnet,
      gateway: item.gateway,
      comments: item.comments,
      status: item.status,
    });
  });

  return Array.from(grouped.values());
}

/**
 * Infers equipment type from machine ID or system name
 */
export function inferEquipmentType(machineId: string, systemName: string): string {
  const combined = `${machineId} ${systemName}`.toLowerCase();

  if (combined.includes('truck') || combined.includes('haul')) return 'TRUCK';
  if (combined.includes('excavator') || combined.includes('ex-')) return 'EXCAVATOR';
  if (combined.includes('drill') || combined.includes('fd-')) return 'DRILL';
  if (combined.includes('loader') || combined.includes('ld-')) return 'LOADER';
  if (combined.includes('dozer') || combined.includes('dz-')) return 'DOZER';
  if (combined.includes('shovel') || combined.includes('sh-')) return 'SHOVEL';
  if (combined.includes('crusher')) return 'CRUSHER';
  if (combined.includes('conveyor')) return 'CONVEYOR';
  if (combined.includes('grader')) return 'GRADER';

  return 'OTHER';
}

/**
 * Generates equipment name from machine ID and system
 */
export function generateEquipmentName(machineId: string, system: string): string {
  if (system && system !== 'UNKNOWN SYSTEM') {
    return `${machineId} - ${system}`;
  }
  return machineId;
}

/**
 * Detects if Excel file has the expected structure
 */
export async function validateExcelStructure(file: File): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  try {
    const sheets = await detectSheets(file);

    const errors: string[] = [];
    const warnings: string[] = [];

    if (sheets.length === 0) {
      errors.push('No sheets found in the Excel file');
    }

    const sheetsWithData = sheets.filter(s => s.hasData);
    if (sheetsWithData.length === 0) {
      errors.push('No sheets with data found');
    }

    if (warnings.length === 0 && sheets.length > 1) {
      warnings.push(`File contains ${sheets.length} sheets. You'll be able to choose which to import.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Failed to validate Excel structure'],
      warnings: [],
    };
  }
}

