/**
 * Types and interfaces for the import/export system
 */

export interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  hasData: boolean;
}

export interface ParsedEquipmentData {
  machineId: string;
  system: string;
  ipAddress: string;
  subnet: string;
  gateway: string;
  comments: string;
  rowIndex: number;
}

export interface GroupedEquipment {
  machineId: string;
  systems: Array<{
    system: string;
    ipAddress: string;
    subnet: string;
    gateway: string;
    comments: string;
  }>;
}

export interface ImportProgress {
  stage: 'idle' | 'reading' | 'parsing' | 'grouping' | 'checking' | 'importing' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
}

export interface DuplicateInFile {
  ipAddress: string;
  occurrences: Array<{
    row: number;
    machineId: string;
    system: string;
  }>;
}

export interface DuplicateCheck {
  ipAddress: string;
  existsInSystem: boolean;
  existingEquipment?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
  duplicates: DuplicateCheck[];
}

export interface ExcelParseResult {
  data: GroupedEquipment[];
  totalRows: number;
  totalIPs: number;
  duplicateIPs: DuplicateInFile[];
}

