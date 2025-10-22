import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  limit: number;
  ttl: number; // in milliseconds
  skipIf?: (request: any) => boolean;
}

export const RateLimit = (options: RateLimitOptions) => 
  SetMetadata(RATE_LIMIT_KEY, options);

// Predefined rate limits
export const RATE_LIMITS = {
  // Auth endpoints - more restrictive
  AUTH: { limit: 5, ttl: 60 * 1000 }, // 5 requests per minute
  
  // API endpoints - standard
  API: { limit: 100, ttl: 60 * 1000 }, // 100 requests per minute
  
  // Webhook endpoints - very restrictive
  WEBHOOK: { limit: 10, ttl: 60 * 1000 }, // 10 requests per minute
  
  // File upload - very restrictive
  UPLOAD: { limit: 5, ttl: 60 * 1000 }, // 5 requests per minute
} as const;
