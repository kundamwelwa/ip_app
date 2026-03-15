import { headers } from 'next/headers';

type RateLimitInfo = { count: number; expiresAt: number };
const rateLimiter = new Map<string, RateLimitInfo>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // 5 requests per IP

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const info = rateLimiter.get(ip);
  
  if (info && now < info.expiresAt) {
    if (info.count >= MAX_REQUESTS) {
      return false; // Rate limit exceeded
    }
    info.count++;
  } else {
    rateLimiter.set(ip, { count: 1, expiresAt: now + WINDOW_MS });
  }

  return true;
}

const registrationLimiter = new Map<string, { count: number; lockUntil: number }>();

export function checkRegistrationRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let info = registrationLimiter.get(ip);
  
  if (info) {
    if (now < info.lockUntil) {
      return { allowed: false, retryAfter: Math.ceil((info.lockUntil - now) / 1000) };
    }
    
    // Past lock time, increment count for exponential backoff (base 2 seconds * 2^attempts, max 15 minutes)
    info.count++;
    const delay = Math.min(2000 * Math.pow(2, info.count), 15 * 60 * 1000); 
    info.lockUntil = now + delay;
  } else {
    info = { count: 1, lockUntil: now }; // First attempt allowed immediately
    registrationLimiter.set(ip, info);
  }
  
  return { allowed: true };
}

export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-forwarded-for') || '127.0.0.1';
}
