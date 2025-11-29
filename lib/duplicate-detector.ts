/**
 * Duplicate Detection System
 * Checks for existing IP addresses and equipment in the system
 */

import { DuplicateCheck, GroupedEquipment } from '@/components/import-export/types';

/**
 * Checks for duplicate IP addresses in the system
 */
export async function checkDuplicateIPs(
  ipAddresses: string[]
): Promise<DuplicateCheck[]> {
  try {
    console.log('🔍 Checking duplicates for', ipAddresses.length, 'IP addresses...');
    
    const response = await fetch('/api/ip-addresses/check-duplicates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ipAddresses }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Duplicate check failed:', response.status, errorText);
      
      // Return empty duplicates instead of throwing - allow import to continue
      console.warn('⚠️ Duplicate check failed, proceeding without duplicate detection');
      return ipAddresses.map(ip => ({
        ipAddress: ip,
        existsInSystem: false,
      }));
    }

    const data = await response.json();
    console.log('✅ Duplicate check complete:', {
      checked: data.totalChecked || ipAddresses.length,
      duplicates: data.totalDuplicates || 0
    });
    
    return data.duplicates || [];
  } catch (error) {
    console.error('Error checking duplicates:', error);
    
    // Return empty array on error - we'll let the import proceed with warnings
    console.warn('⚠️ Duplicate check error, proceeding without duplicate detection');
    return ipAddresses.map(ip => ({
      ipAddress: ip,
      existsInSystem: false,
    }));
  }
}

/**
 * Extracts all IP addresses from grouped equipment data
 */
export function extractIPAddresses(data: GroupedEquipment[]): string[] {
  const ips: string[] = [];
  
  data.forEach((equipment) => {
    equipment.systems.forEach((system) => {
      if (system.ipAddress) {
        ips.push(system.ipAddress);
      }
    });
  });

  return ips;
}

/**
 * Filters out duplicate entries from import data
 */
export function filterDuplicates(
  data: GroupedEquipment[],
  duplicateChecks: DuplicateCheck[]
): {
  filtered: GroupedEquipment[];
  skipped: number;
  warnings: string[];
} {
  const duplicateIPSet = new Set(
    duplicateChecks
      .filter((check) => check.existsInSystem)
      .map((check) => check.ipAddress)
  );

  const warnings: string[] = [];
  let skippedCount = 0;

  const filtered = data.map((equipment) => {
    const filteredSystems = equipment.systems.filter((system) => {
      if (duplicateIPSet.has(system.ipAddress)) {
        warnings.push(
          `Skipped ${system.ipAddress} (${system.system}) - already exists in system`
        );
        skippedCount++;
        return false;
      }
      return true;
    });

    return {
      ...equipment,
      systems: filteredSystems,
    };
  }).filter((equipment) => equipment.systems.length > 0); // Remove equipment with no systems left

  return {
    filtered,
    skipped: skippedCount,
    warnings,
  };
}

/**
 * Generates a duplicate report
 */
export function generateDuplicateReport(duplicateChecks: DuplicateCheck[]): {
  totalDuplicates: number;
  duplicateDetails: string[];
} {
  const existingDuplicates = duplicateChecks.filter((check) => check.existsInSystem);

  const duplicateDetails = existingDuplicates.map((check) => {
    if (check.existingEquipment) {
      return `${check.ipAddress} - Already assigned to ${check.existingEquipment.name} (${check.existingEquipment.type})`;
    }
    return `${check.ipAddress} - Already exists in system`;
  });

  return {
    totalDuplicates: existingDuplicates.length,
    duplicateDetails,
  };
}

