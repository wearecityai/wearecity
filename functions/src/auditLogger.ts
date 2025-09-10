/**
 * Enterprise-grade audit logging for government compliance
 * Tracks all security events and user actions
 */

import * as admin from 'firebase-admin';

export enum AuditEventType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization', 
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  SECURITY_VIOLATION = 'security_violation',
  API_USAGE = 'api_usage',
  SYSTEM_EVENT = 'system_event',
  RATE_LIMIT = 'rate_limit',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuditEvent {
  eventId: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  timestamp: Date;
  source: string;
  action: string;
  resource?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private db = admin.firestore();

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log audit event with full traceability
   */
  async logEvent(event: Partial<AuditEvent>): Promise<void> {
    try {
      const fullEvent: AuditEvent = {
        eventId: this.generateEventId(),
        eventType: event.eventType || AuditEventType.SYSTEM_EVENT,
        severity: event.severity || AuditSeverity.LOW,
        timestamp: new Date(),
        source: event.source || 'firebase-functions',
        action: event.action || 'unknown',
        success: event.success ?? true,
        details: event.details || {},
        ...event
      };

      // Store in Firestore with partitioning by date for performance
      const datePartition = this.getDatePartition(fullEvent.timestamp);
      await this.db
        .collection('audit_logs')
        .doc(datePartition)
        .collection('events')
        .doc(fullEvent.eventId)
        .set(fullEvent);

      // Log to Cloud Logging for real-time monitoring
      console.log(`[AUDIT] ${fullEvent.eventType.toUpperCase()}: ${fullEvent.action}`, {
        eventId: fullEvent.eventId,
        userId: fullEvent.userId,
        severity: fullEvent.severity,
        success: fullEvent.success,
        timestamp: fullEvent.timestamp.toISOString()
      });

      // Send alerts for critical events
      if (fullEvent.severity === AuditSeverity.CRITICAL) {
        await this.sendCriticalAlert(fullEvent);
      }

    } catch (error) {
      console.error('❌ Failed to log audit event:', error);
      // Don't throw - logging failure shouldn't break main functionality
    }
  }

  /**
   * Log authentication events
   */
  async logAuthentication(userId: string, action: string, success: boolean, details: any = {}, req?: any): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.AUTHENTICATION,
      severity: success ? AuditSeverity.LOW : AuditSeverity.HIGH,
      userId,
      action,
      success,
      details,
      ipAddress: this.extractIpAddress(req),
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Log authorization violations
   */
  async logAuthorizationViolation(userId: string, resource: string, details: any = {}, req?: any): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.AUTHORIZATION,
      severity: AuditSeverity.HIGH,
      userId,
      action: 'access_denied',
      resource,
      success: false,
      details,
      ipAddress: this.extractIpAddress(req),
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(userId: string, action: string, details: any, req?: any): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      severity: AuditSeverity.CRITICAL,
      userId,
      action,
      success: false,
      details: {
        suspicionReason: details.reason,
        ...details
      },
      ipAddress: this.extractIpAddress(req),
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Log data access for compliance
   */
  async logDataAccess(userId: string, resource: string, action: string, recordCount?: number): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.DATA_ACCESS,
      severity: AuditSeverity.LOW,
      userId,
      action,
      resource,
      success: true,
      details: {
        recordCount: recordCount || 1,
        accessType: 'read'
      }
    });
  }

  /**
   * Log rate limit violations
   */
  async logRateLimitViolation(userId: string, service: string, details: any, req?: any): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.RATE_LIMIT,
      severity: AuditSeverity.MEDIUM,
      userId,
      action: 'rate_limit_exceeded',
      resource: service,
      success: false,
      details,
      ipAddress: this.extractIpAddress(req),
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Log API usage for cost monitoring
   */
  async logApiUsage(userId: string, service: string, cost: number, details: any = {}): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.API_USAGE,
      severity: AuditSeverity.LOW,
      userId,
      action: 'api_call',
      resource: service,
      success: true,
      details: {
        cost,
        currency: 'USD',
        ...details
      }
    });
  }

  /**
   * Query audit logs with filtering
   */
  async queryAuditLogs(filters: {
    userId?: string;
    eventType?: AuditEventType;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditEvent[]> {
    let query: FirebaseFirestore.Query = this.db.collectionGroup('events');

    if (filters.userId) {
      query = query.where('userId', '==', filters.userId);
    }
    if (filters.eventType) {
      query = query.where('eventType', '==', filters.eventType);
    }
    if (filters.severity) {
      query = query.where('severity', '==', filters.severity);
    }
    if (filters.startDate) {
      query = query.where('timestamp', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('timestamp', '<=', filters.endDate);
    }

    query = query.orderBy('timestamp', 'desc').limit(filters.limit || 100);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as AuditEvent);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get date partition for efficient querying
   */
  private getDatePartition(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Extract IP address from request
   */
  private extractIpAddress(req: any): string | undefined {
    if (!req) return undefined;
    
    return req.ip || 
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers?.['x-real-ip'];
  }

  /**
   * Send critical alerts (integrate with monitoring systems)
   */
  private async sendCriticalAlert(event: AuditEvent): Promise<void> {
    // In production, integrate with:
    // - Cloud Monitoring
    // - PagerDuty
    // - Slack/Teams notifications
    // - Email alerts
    
    console.error(`🚨 CRITICAL SECURITY EVENT: ${event.action}`, {
      eventId: event.eventId,
      userId: event.userId,
      timestamp: event.timestamp.toISOString(),
      details: event.details
    });
  }

  /**
   * Get audit statistics for dashboard
   */
  async getAuditStatistics(dateRange: { start: Date; end: Date }): Promise<{
    totalEvents: number;
    eventsByType: { [key: string]: number };
    eventsBySeverity: { [key: string]: number };
    suspiciousActivities: number;
    rateLimitViolations: number;
  }> {
    // This would be implemented with aggregation queries
    // For now, return basic structure
    return {
      totalEvents: 0,
      eventsByType: {},
      eventsBySeverity: {},
      suspiciousActivities: 0,
      rateLimitViolations: 0
    };
  }
}

export const auditLogger = AuditLogger.getInstance();