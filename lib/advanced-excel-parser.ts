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
        }) as any[][];

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
        const headerRow = jsonData[0];
        const initialColumnMap = detectColumnStructure(headerRow);
        const hasHeader = Object.values(initialColumnMap).some(idx => idx !== -1);

        // Optimize IP Column Detection:
        // Scan data to find the column with the most UNIQUE IPs usually indicates the primary IP column
        // This prevents selecting "Gateway" or "Server IP" columns which often have repeated values
        const ipColumnStats = new Map<number, Set<string>>();
        const dataRowsToCheck = jsonData.slice(hasHeader ? 1 : 0, Math.min(jsonData.length, 100)); // Check first 100 rows

        dataRowsToCheck.forEach(row => {
          row.forEach((cell: any, index: number) => {
            const val = cell?.toString().trim();
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
        const skippedRows: { rowIndex: number; reason: string }[] = [];

        const startRow = hasHeader ? 1 : 0;
        let currentMachineId = '';

        // Capture headers for system naming
        const headers = hasHeader && headerRow ? headerRow.map((h: any) => h?.toString().trim()) : [];

        for (let rowIndex = startRow; rowIndex < jsonData.length; rowIndex++) {
          const row = jsonData[rowIndex];

          // Skip empty rows
          if (!row || row.every((cell: any) => !cell || cell.toString().trim() === '')) {
            continue;
          }

          const rawMachineId = getCellValue(row, columnMap.machineId);
          // Maintain current machine ID even when cells are merged/blank
          if (rawMachineId && !isHeaderValue(rawMachineId)) {
            currentMachineId = rawMachineId;
          }
          const machineId = currentMachineId || rawMachineId || `EQUIPMENT_${rowIndex}`;

          const rawSystem = getCellValue(row, columnMap.system);
          const defaultSystem = rawSystem && !isHeaderValue(rawSystem) ? rawSystem : 'MAIN SYSTEM';

          const subnet = getCellValue(row, columnMap.subnet);
          const gateway = getCellValue(row, columnMap.gateway);
          const comments = getCellValue(row, columnMap.comments);

          let ipsFoundInRow = 0;

          // Scan ALL columns for IPs
          row.forEach((cell: any, colIndex: number) => {
            const cellValue = cell?.toString().trim();
            if (isValidIPAddress(cellValue)) {
              // Determine System Name based on column header if possible
              let systemName = defaultSystem;
              if (headers[colIndex] && !isHeaderValue(headers[colIndex])) {
                // Clean up header to make it a nice system name (e.g. "DSS IP Address" -> "DSS")
                const header = headers[colIndex];
                if (!header.toLowerCase().includes('address') && !header.toLowerCase().includes('ip')) {
                  systemName = header;
                } else {
                  // If header is just "IP Address" or "IP", try to clean it
                  const cleaned = header.replace(/ip\s?address/i, '').replace(/ip/i, '').trim();
                  if (cleaned && cleaned.length > 2) systemName = cleaned;
                }
              }

              const normalizedIP = normalizeIPAddress(cellValue);
              if (!seenIPs.has(normalizedIP)) {
                seenIPs.add(normalizedIP);
                ipFirstSeen.set(normalizedIP, { row: rowIndex + 1, machineId, system: systemName });

                parsedData.push({
                  machineId: machineId,
                  system: systemName,
                  ipAddress: cellValue,
                  subnet: subnet || '255.255.255.0',
                  gateway: gateway || '',
                  comments: comments || '',
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

          if (ipsFoundInRow === 0 && !isHeaderValue(rawMachineId)) {
            skippedRows.push({
              rowIndex: rowIndex + 1,
              reason: `No valid IP found in any column`
            });
          }
        }

        console.log('✅ Parsing Results:', {
          totalParsed: parsedData.length,
          uniqueIPs: seenIPs.size,
          duplicates: duplicateMap.size,
          skipped: skippedRows.length,
          skippedDetails: skippedRows.slice(0, 5)
        });

        // Group by machine ID
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
 * Detects column structure from header row with intelligent pattern matching
 */
function detectColumnStructure(headerRow: any[]): {
  machineId: number;
  system: number;
  ipAddress: number;
  subnet: number;
  gateway: number;
  comments: number;
} {
  const columnMap = {
    machineId: -1,
    system: -1,
    ipAddress: -1,
    subnet: -1,
    gateway: -1,
    comments: -1,
  };

  // If header row looks like data (contains IP addresses), try to detect from first few data rows
  const hasIPInHeader = headerRow.some((cell: any) => {
    const str = cell?.toString().trim() || '';
    return isValidIPAddress(str);
  });

  // If no clear headers, try to infer from data structure
  if (hasIPInHeader || headerRow.every((cell: any) => !cell || cell.toString().trim() === '')) {
    // Try common column positions based on typical Excel layouts
    // Often: Machine ID (col 0), System (col 1), IP (col 2), Subnet (col 3), Gateway (col 4), Comments (col 5)
    columnMap.machineId = 0;
    columnMap.system = 1;
    columnMap.ipAddress = 2;
    columnMap.subnet = 3;
    columnMap.gateway = 4;
    columnMap.comments = 5;
    return columnMap;
  }

  headerRow.forEach((header, index) => {
    if (!header) return;

    const headerStr = header.toString().toLowerCase().trim().replace(/[_\s-]/g, '');

    // Machine ID detection (more flexible patterns)
    if (
      columnMap.machineId === -1 && (
        headerStr.includes('machineid') ||
        headerStr.includes('equipmentid') ||
        (headerStr.includes('machine') && headerStr.includes('id')) ||
        headerStr === 'id' ||
        headerStr === 'machine' ||
        headerStr.includes('equipment') ||
        headerStr.includes('unit') ||
        headerStr.includes('asset')
      )
    ) {
      columnMap.machineId = index;
    }

    // System detection (more flexible patterns)
    if (
      columnMap.system === -1 && (
        headerStr.includes('system') ||
        headerStr.includes('component') ||
        headerStr.includes('device') ||
        headerStr.includes('name') ||
        headerStr.includes('description') ||
        headerStr.includes('type')
      )
    ) {
      columnMap.system = index;
    }

    // IP Address detection (more flexible patterns - prioritize exact matches)
    if (
      columnMap.ipAddress === -1 && (
        headerStr === 'ip' ||
        headerStr === 'ipaddress' ||
        headerStr.includes('ipaddress') ||
        (headerStr.includes('ip') && !headerStr.includes('equipment')) ||
        headerStr === 'address' ||
        (headerStr.includes('address') && !headerStr.includes('mac'))
      )
    ) {
      columnMap.ipAddress = index;
    }

    // Subnet detection (more flexible)
    if (
      headerStr.includes('subnet') ||
      headerStr.includes('mask') ||
      headerStr.includes('netmask')
    ) {
      columnMap.subnet = index;
    }

    // Gateway detection (more flexible)
    if (
      headerStr.includes('gateway') ||
      headerStr.includes('router') ||
      headerStr.includes('gw')
    ) {
      columnMap.gateway = index;
    }

    // Comments detection (more flexible)
    if (
      headerStr.includes('comment') ||
      headerStr.includes('note') ||
      headerStr.includes('description') ||
      headerStr.includes('remark') ||
      headerStr.includes('memo')
    ) {
      columnMap.comments = index;
    }
  });

  // Fallback: If columns not detected, use positional mapping
  // Assuming order: MACHINE_ID | SYSTEM | IP_ADDRESS | SUBNET | GATEWAY | COMMENTS
  if (columnMap.machineId === -1) columnMap.machineId = 0;
  if (columnMap.system === -1) columnMap.system = 1;
  if (columnMap.ipAddress === -1) columnMap.ipAddress = 2;
  if (columnMap.subnet === -1) columnMap.subnet = 3;
  if (columnMap.gateway === -1) columnMap.gateway = 4;
  if (columnMap.comments === -1) columnMap.comments = 5;

  return columnMap;
}

/**
 * Gets cell value safely
 */
function getCellValue(row: any[], columnIndex: number): string {
  if (columnIndex === -1 || !row[columnIndex]) return '';
  return row[columnIndex].toString().trim();
}

/**
 * Checks if a cell value looks like a header label rather than actual data
 */
function isHeaderValue(value: string): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  const headerTerms = ['machine id', 'machine', 'system', 'ip address', 'subnet', 'gateway', 'comments'];
  return headerTerms.includes(normalized);
}

function normalizeIPAddress(ip: string): string {
  const trimmed = ip.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 4) return trimmed;
  return parts.map((part) => String(Number(part))).join('.');
}

/**
 * Groups parsed data by machine ID
 */
function groupByMachineId(data: ParsedEquipmentData[]): GroupedEquipment[] {
  const grouped = new Map<string, GroupedEquipment>();

  data.forEach((item) => {
    if (!grouped.has(item.machineId)) {
      grouped.set(item.machineId, {
        machineId: item.machineId,
        systems: [],
      });
    }

    grouped.get(item.machineId)!.systems.push({
      system: item.system,
      ipAddress: item.ipAddress,
      subnet: item.subnet,
      gateway: item.gateway,
      comments: item.comments,
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

