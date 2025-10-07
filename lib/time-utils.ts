/**
 * Utility functions for time formatting and calculations
 */

export interface TimeAgoResult {
  value: number;
  unit: string;
  fullText: string;
  isRecent: boolean;
}

/**
 * Calculate time difference and return human-readable format
 */
export function getTimeAgo(date: Date | string | null | undefined): TimeAgoResult {
  if (!date) {
    return {
      value: 0,
      unit: 'never',
      fullText: 'Never',
      isRecent: false
    };
  }

  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return {
      value: diffInSeconds,
      unit: 'seconds',
      fullText: diffInSeconds === 1 ? '1 second ago' : `${diffInSeconds} seconds ago`,
      isRecent: true
    };
  } else if (diffInMinutes < 60) {
    return {
      value: diffInMinutes,
      unit: 'minutes',
      fullText: diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`,
      isRecent: true
    };
  } else if (diffInHours < 24) {
    return {
      value: diffInHours,
      unit: 'hours',
      fullText: diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`,
      isRecent: true
    };
  } else if (diffInDays < 7) {
    return {
      value: diffInDays,
      unit: 'days',
      fullText: diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`,
      isRecent: false
    };
  } else if (diffInWeeks < 4) {
    return {
      value: diffInWeeks,
      unit: 'weeks',
      fullText: diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`,
      isRecent: false
    };
  } else if (diffInMonths < 12) {
    return {
      value: diffInMonths,
      unit: 'months',
      fullText: diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`,
      isRecent: false
    };
  } else {
    return {
      value: diffInYears,
      unit: 'years',
      fullText: diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`,
      isRecent: false
    };
  }
}

/**
 * Format date for display with different levels of detail
 */
export function formatDateForDisplay(date: Date | string | null | undefined, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!date) return 'Never';

  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return targetDate.toLocaleDateString();
    case 'medium':
      return targetDate.toLocaleString();
    case 'long':
      return targetDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    default:
      return targetDate.toLocaleString();
  }
}

/**
 * Calculate uptime percentage based on last seen time
 */
export function calculateUptime(lastSeen: Date | string | null | undefined, thresholdMinutes: number = 5): number {
  if (!lastSeen) return 0;

  const now = new Date();
  const lastSeenDate = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);

  // If last seen is within threshold, consider it online
  if (diffInMinutes <= thresholdMinutes) {
    return 100;
  }

  // Calculate uptime based on how long ago it was last seen
  // This is a simplified calculation - in reality, you'd want to track actual uptime
  const hoursSinceLastSeen = diffInMinutes / 60;
  if (hoursSinceLastSeen <= 1) return 95;
  if (hoursSinceLastSeen <= 6) return 85;
  if (hoursSinceLastSeen <= 24) return 70;
  if (hoursSinceLastSeen <= 72) return 50;
  return 0;
}

/**
 * Get status color based on last seen time
 */
export function getStatusColorFromLastSeen(lastSeen: Date | string | null | undefined): string {
  const timeAgo = getTimeAgo(lastSeen);
  
  if (timeAgo.unit === 'never') return 'text-gray-500';
  if (timeAgo.isRecent) return 'text-green-600';
  if (timeAgo.unit === 'minutes' && timeAgo.value <= 5) return 'text-green-600';
  if (timeAgo.unit === 'minutes' && timeAgo.value <= 15) return 'text-yellow-600';
  if (timeAgo.unit === 'hours' && timeAgo.value <= 1) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Format uptime duration
 */
export function formatUptimeDuration(uptimeMs: number): string {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
