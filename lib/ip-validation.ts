/**
 * IP Address validation utilities
 */

export interface IPValidationResult {
  isValid: boolean;
  error?: string;
  type?: 'IPv4' | 'IPv6';
}

/**
 * Validates if a string is a valid IPv4 address
 */
export function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * Validates if a string is a valid IPv6 address
 */
export function isValidIPv6(ip: string): boolean {
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const ipv6CompressedRegex = /^(([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})|(::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:)*::)|(::)$/;
  return ipv6Regex.test(ip) || ipv6CompressedRegex.test(ip);
}

/**
 * Validates an IP address and returns detailed result
 */
export function validateIPAddress(ip: string): IPValidationResult {
  if (!ip || ip.trim() === '') {
    return {
      isValid: false,
      error: 'IP address is required'
    };
  }

  const trimmedIP = ip.trim();

  if (isValidIPv4(trimmedIP)) {
    return {
      isValid: true,
      type: 'IPv4'
    };
  }

  if (isValidIPv6(trimmedIP)) {
    return {
      isValid: true,
      type: 'IPv6'
    };
  }

  return {
    isValid: false,
    error: 'Invalid IP address format. Please enter a valid IPv4 or IPv6 address.'
  };
}

/**
 * Checks if an IP address is in a private range
 */
export function isPrivateIP(ip: string): boolean {
  if (!isValidIPv4(ip)) return false;

  const parts = ip.split('.').map(Number);
  
  // Check for private IP ranges
  return (
    // 10.0.0.0/8
    parts[0] === 10 ||
    // 172.16.0.0/12
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    // 192.168.0.0/16
    (parts[0] === 192 && parts[1] === 168) ||
    // 127.0.0.0/8 (localhost)
    parts[0] === 127
  );
}

/**
 * Formats an IP address for display
 */
export function formatIPAddress(ip: string): string {
  return ip.trim();
}

/**
 * Gets IP address type description
 */
export function getIPTypeDescription(type: 'IPv4' | 'IPv6'): string {
  switch (type) {
    case 'IPv4':
      return 'Internet Protocol version 4';
    case 'IPv6':
      return 'Internet Protocol version 6';
    default:
      return 'Unknown IP type';
  }
}
