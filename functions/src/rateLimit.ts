/**
 * Rate limiting service for Firebase Functions
 * Prevents abuse and ensures fair usage
 */

import * as admin from 'firebase-admin';

interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
  service: string;
}

interface RateLimitRecord {
  userId: string;
  service: string;
  requests: number;
  windowStart: Date;
}

const DEFAULT_LIMITS: { [service: string]: RateLimitConfig } = {
  'ai-chat': { maxRequests: 50, windowMinutes: 60, service: 'ai-chat' },
  'google-search': { maxRequests: 100, windowMinutes: 60, service: 'google-search' },
  'document-upload': { maxRequests: 10, windowMinutes: 60, service: 'document-upload' }
};

export class RateLimitService {
  private static instance: RateLimitService;
  private db = admin.firestore();

  private constructor() {}

  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Check if user has exceeded rate limit for a service
   */
  async checkRateLimit(userId: string, service: string): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetTime: Date;
  }> {
    const config = DEFAULT_LIMITS[service];
    if (!config) {
      throw new Error(`Unknown service: ${service}`);
    }

    const now = new Date();
    const docRef = this.db.collection('rate_limits').doc(`${userId}_${service}`);

    try {
      const doc = await docRef.get();
      let record: RateLimitRecord;

      if (doc.exists) {
        const data = doc.data()!;
        record = {
          userId: data.userId,
          service: data.service,
          requests: data.requests,
          windowStart: data.windowStart.toDate()
        };

        // Check if window has expired
        const windowExpiry = new Date(record.windowStart);
        windowExpiry.setMinutes(windowExpiry.getMinutes() + config.windowMinutes);

        if (now > windowExpiry) {
          // Reset window
          record = {
            userId,
            service,
            requests: 0,
            windowStart: now
          };
        }
      } else {
        // Create new record
        record = {
          userId,
          service,
          requests: 0,
          windowStart: now
        };
      }

      const remainingRequests = Math.max(0, config.maxRequests - record.requests);
      const allowed = record.requests < config.maxRequests;
      
      if (allowed) {
        // Increment request count
        record.requests += 1;
        await docRef.set({
          userId: record.userId,
          service: record.service,
          requests: record.requests,
          windowStart: admin.firestore.Timestamp.fromDate(record.windowStart),
          lastRequest: admin.firestore.Timestamp.fromDate(now)
        });
      }

      const resetTime = new Date(record.windowStart);
      resetTime.setMinutes(resetTime.getMinutes() + config.windowMinutes);

      return {
        allowed,
        remainingRequests: allowed ? remainingRequests - 1 : remainingRequests,
        resetTime
      };

    } catch (error) {
      console.error('Error checking rate limit:', error);
      // In case of error, allow request but log the issue
      return {
        allowed: true,
        remainingRequests: config.maxRequests - 1,
        resetTime: new Date(now.getTime() + config.windowMinutes * 60 * 1000)
      };
    }
  }

  /**
   * Get rate limit status for a user and service without incrementing
   */
  async getRateLimitStatus(userId: string, service: string): Promise<{
    remainingRequests: number;
    resetTime: Date;
    totalAllowed: number;
  }> {
    const config = DEFAULT_LIMITS[service];
    if (!config) {
      throw new Error(`Unknown service: ${service}`);
    }

    const docRef = this.db.collection('rate_limits').doc(`${userId}_${service}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      const resetTime = new Date();
      resetTime.setMinutes(resetTime.getMinutes() + config.windowMinutes);
      return {
        remainingRequests: config.maxRequests,
        resetTime,
        totalAllowed: config.maxRequests
      };
    }

    const data = doc.data()!;
    const windowStart = data.windowStart.toDate();
    const requests = data.requests;

    const resetTime = new Date(windowStart);
    resetTime.setMinutes(resetTime.getMinutes() + config.windowMinutes);

    // Check if window has expired
    const now = new Date();
    if (now > resetTime) {
      return {
        remainingRequests: config.maxRequests,
        resetTime: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
        totalAllowed: config.maxRequests
      };
    }

    return {
      remainingRequests: Math.max(0, config.maxRequests - requests),
      resetTime,
      totalAllowed: config.maxRequests
    };
  }

  /**
   * Clear rate limit for a user (admin function)
   */
  async clearRateLimit(userId: string, service: string): Promise<void> {
    const docRef = this.db.collection('rate_limits').doc(`${userId}_${service}`);
    await docRef.delete();
  }
}

export const rateLimitService = RateLimitService.getInstance();