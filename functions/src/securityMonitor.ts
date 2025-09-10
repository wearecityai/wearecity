/**
 * Real-time security monitoring and threat detection
 * AI-powered anomaly detection for government-grade security
 */

import { auditLogger, AuditEventType, AuditSeverity } from './auditLogger';
import * as admin from 'firebase-admin';

export interface SecurityThreat {
  threatId: string;
  threatType: ThreatType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  description: string;
  evidence: any[];
  timestamp: Date;
  status: 'detected' | 'investigating' | 'mitigated' | 'false_positive';
  autoMitigated: boolean;
}

export enum ThreatType {
  BRUTE_FORCE = 'brute_force',
  RAPID_API_CALLS = 'rapid_api_calls', 
  SUSPICIOUS_LOCATION = 'suspicious_location',
  PROMPT_INJECTION = 'prompt_injection',
  DATA_EXFILTRATION = 'data_exfiltration',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  UNUSUAL_ACTIVITY_PATTERN = 'unusual_activity_pattern',
  MULTIPLE_FAILED_AUTH = 'multiple_failed_auth'
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private db = admin.firestore();
  private userActivityCache: Map<string, UserActivityTracker> = new Map();

  private constructor() {
    // Clean cache every hour
    setInterval(() => this.cleanActivityCache(), 60 * 60 * 1000);
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Monitor authentication attempts
   */
  async monitorAuthentication(userId: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<void> {
    const tracker = this.getUserActivityTracker(userId);
    
    if (!success) {
      tracker.failedAttempts++;
      tracker.lastFailedAttempt = new Date();
      
      // Detect brute force attacks
      if (tracker.failedAttempts >= 5) {
        await this.detectThreat({
          threatType: ThreatType.MULTIPLE_FAILED_AUTH,
          severity: 'high',
          userId,
          ipAddress,
          description: `Multiple failed authentication attempts: ${tracker.failedAttempts}`,
          evidence: [
            { type: 'failed_attempts', count: tracker.failedAttempts },
            { type: 'time_window', minutes: 60 },
            { type: 'ip_address', value: ipAddress }
          ]
        });
      }
    } else {
      // Reset failed attempts on successful login
      tracker.failedAttempts = 0;
      tracker.lastSuccessfulAuth = new Date();
      
      // Check for suspicious location if IP changed significantly
      if (tracker.lastIpAddress && tracker.lastIpAddress !== ipAddress) {
        await this.checkSuspiciousLocation(userId, tracker.lastIpAddress, ipAddress);
      }
      
      tracker.lastIpAddress = ipAddress;
    }
  }

  /**
   * Monitor API usage patterns
   */
  async monitorApiUsage(userId: string, service: string, endpoint: string): Promise<void> {
    const tracker = this.getUserActivityTracker(userId);
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Track requests per minute
    tracker.apiCalls.push({ timestamp: now, service, endpoint });
    
    // Remove old entries
    tracker.apiCalls = tracker.apiCalls.filter(call => call.timestamp > oneMinuteAgo);
    
    // Detect rapid API calls (DDoS attempt)
    if (tracker.apiCalls.length > 100) { // 100+ calls per minute
      await this.detectThreat({
        threatType: ThreatType.RAPID_API_CALLS,
        severity: 'high',
        userId,
        description: `Rapid API calls detected: ${tracker.apiCalls.length} calls in last minute`,
        evidence: [
          { type: 'calls_per_minute', count: tracker.apiCalls.length },
          { type: 'services', services: [...new Set(tracker.apiCalls.map(c => c.service))] },
          { type: 'endpoints', endpoints: [...new Set(tracker.apiCalls.map(c => c.endpoint))] }
        ]
      });
    }
  }

  /**
   * Monitor chat queries for prompt injection
   */
  async monitorChatQuery(userId: string, query: string, ipAddress?: string): Promise<boolean> {
    const suspiciousPatterns = [
      // Prompt injection patterns
      /ignore\s+all\s+previous\s+instructions/i,
      /system\s*:\s*you\s+are\s+now/i,
      /pretend\s+you\s+are\s+a\s+different/i,
      /roleplay\s+as\s+(?:administrator|admin|root)/i,
      /forget\s+everything\s+and/i,
      /new\s+instructions?\s*:/i,
      
      // Data exfiltration attempts  
      /show\s+me\s+all\s+(?:users?|passwords?|keys?|secrets?)/i,
      /list\s+all\s+(?:database|admin|confidential)/i,
      /dump\s+(?:database|table|collection)/i,
      
      // System command injection
      /exec\s*\(/i,
      /eval\s*\(/i,
      /system\s*\(/i,
      /shell\s*\(/i,
      /process\s*\./i,
      
      // SQL injection patterns
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /'.*or.*1=1/i,
      /';.*--/i
    ];

    let threatDetected = false;
    const evidence = [];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(query)) {
        threatDetected = true;
        evidence.push({
          type: 'malicious_pattern',
          pattern: pattern.source,
          match: query.match(pattern)?.[0]
        });
      }
    }

    // Additional heuristics
    const suspiciousKeywords = ['admin', 'password', 'secret', 'token', 'key', 'config', 'database'];
    const suspiciousCount = suspiciousKeywords.filter(keyword => 
      query.toLowerCase().includes(keyword)
    ).length;

    if (suspiciousCount >= 3) {
      threatDetected = true;
      evidence.push({
        type: 'suspicious_keywords',
        count: suspiciousCount,
        keywords: suspiciousKeywords.filter(k => query.toLowerCase().includes(k))
      });
    }

    if (threatDetected) {
      await this.detectThreat({
        threatType: ThreatType.PROMPT_INJECTION,
        severity: 'critical',
        userId,
        ipAddress,
        description: 'Potential prompt injection or malicious query detected',
        evidence,
        autoMitigate: true
      });
      
      return false; // Block the query
    }

    return true; // Allow the query
  }

  /**
   * Monitor data access patterns
   */
  async monitorDataAccess(userId: string, collection: string, recordCount: number): Promise<void> {
    const tracker = this.getUserActivityTracker(userId);
    const now = new Date();
    
    tracker.dataAccess.push({ timestamp: now, collection, recordCount });
    
    // Remove old entries (last 24 hours)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    tracker.dataAccess = tracker.dataAccess.filter(access => access.timestamp > twentyFourHoursAgo);
    
    // Calculate total records accessed in 24h
    const totalRecords = tracker.dataAccess.reduce((sum, access) => sum + access.recordCount, 0);
    
    // Detect potential data exfiltration
    if (totalRecords > 10000) { // Threshold for large data access
      await this.detectThreat({
        threatType: ThreatType.DATA_EXFILTRATION,
        severity: 'critical',
        userId,
        description: `Potential data exfiltration: ${totalRecords} records accessed in 24h`,
        evidence: [
          { type: 'total_records', count: totalRecords },
          { type: 'time_window', hours: 24 },
          { type: 'collections', collections: [...new Set(tracker.dataAccess.map(a => a.collection))] }
        ]
      });
    }
  }

  /**
   * Detect and handle security threats
   */
  private async detectThreat(threat: Partial<SecurityThreat>): Promise<void> {
    const fullThreat: SecurityThreat = {
      threatId: this.generateThreatId(),
      timestamp: new Date(),
      status: 'detected',
      autoMitigated: false,
      ...threat
    } as SecurityThreat;

    // Store threat
    await this.db.collection('security_threats').doc(fullThreat.threatId).set(fullThreat);

    // Log audit event
    await auditLogger.logEvent({
      eventType: AuditEventType.SECURITY_VIOLATION,
      severity: this.mapSeverity(fullThreat.severity),
      userId: fullThreat.userId,
      action: 'threat_detected',
      details: {
        threatType: fullThreat.threatType,
        threatId: fullThreat.threatId,
        evidence: fullThreat.evidence
      },
      success: false
    });

    // Auto-mitigation for critical threats
    if (fullThreat.severity === 'critical' && threat.autoMitigate) {
      await this.mitigateThreat(fullThreat);
    }

    // Send real-time alerts
    await this.sendThreatAlert(fullThreat);
  }

  /**
   * Auto-mitigation strategies
   */
  private async mitigateThreat(threat: SecurityThreat): Promise<void> {
    switch (threat.threatType) {
      case ThreatType.MULTIPLE_FAILED_AUTH:
        if (threat.userId) {
          await this.temporaryUserSuspension(threat.userId, 30); // 30 minutes
        }
        break;
        
      case ThreatType.RAPID_API_CALLS:
        if (threat.userId) {
          await this.enhanceRateLimit(threat.userId, 90); // Severe rate limiting for 90 minutes
        }
        break;
        
      case ThreatType.PROMPT_INJECTION:
        if (threat.userId) {
          await this.flagUserForReview(threat.userId);
        }
        break;
    }

    // Update threat status
    await this.db.collection('security_threats').doc(threat.threatId).update({
      status: 'mitigated',
      autoMitigated: true,
      mitigatedAt: new Date()
    });
  }

  /**
   * Check for suspicious location changes
   */
  private async checkSuspiciousLocation(userId: string, oldIp?: string, newIp?: string): Promise<void> {
    if (!oldIp || !newIp) return;
    
    // In production, use IP geolocation service
    // For now, just detect if IPs are very different
    const oldSegments = oldIp.split('.');
    const newSegments = newIp.split('.');
    
    if (oldSegments[0] !== newSegments[0] && oldSegments[1] !== newSegments[1]) {
      await this.detectThreat({
        threatType: ThreatType.SUSPICIOUS_LOCATION,
        severity: 'medium',
        userId,
        description: 'Login from significantly different IP address',
        evidence: [
          { type: 'old_ip', value: oldIp },
          { type: 'new_ip', value: newIp }
        ]
      });
    }
  }

  private async temporaryUserSuspension(userId: string, minutes: number): Promise<void> {
    const suspensionEnd = new Date(Date.now() + minutes * 60 * 1000);
    
    await this.db.collection('user_suspensions').doc(userId).set({
      userId,
      suspendedAt: new Date(),
      suspensionEnd,
      reason: 'Multiple failed authentication attempts',
      autoGenerated: true
    });
    
    console.log(`🚫 User ${userId} temporarily suspended until ${suspensionEnd.toISOString()}`);
  }

  private async enhanceRateLimit(userId: string, minutes: number): Promise<void> {
    const enhancedUntil = new Date(Date.now() + minutes * 60 * 1000);
    
    await this.db.collection('enhanced_rate_limits').doc(userId).set({
      userId,
      enhancedAt: new Date(),
      enhancedUntil,
      reason: 'Rapid API calls detected',
      limitFactor: 0.1 // 10% of normal rate limit
    });
  }

  private async flagUserForReview(userId: string): Promise<void> {
    await this.db.collection('user_flags').doc(userId).set({
      userId,
      flaggedAt: new Date(),
      reason: 'Potential prompt injection attempt',
      status: 'pending_review',
      autoGenerated: true
    });
  }

  private getUserActivityTracker(userId: string): UserActivityTracker {
    if (!this.userActivityCache.has(userId)) {
      this.userActivityCache.set(userId, {
        userId,
        failedAttempts: 0,
        apiCalls: [],
        dataAccess: []
      });
    }
    return this.userActivityCache.get(userId)!;
  }

  private cleanActivityCache(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [userId, tracker] of this.userActivityCache.entries()) {
      if (tracker.lastSuccessfulAuth && tracker.lastSuccessfulAuth < oneHourAgo) {
        this.userActivityCache.delete(userId);
      }
    }
  }

  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapSeverity(severity: string): AuditSeverity {
    switch (severity) {
      case 'low': return AuditSeverity.LOW;
      case 'medium': return AuditSeverity.MEDIUM;
      case 'high': return AuditSeverity.HIGH;
      case 'critical': return AuditSeverity.CRITICAL;
      default: return AuditSeverity.MEDIUM;
    }
  }

  private async sendThreatAlert(threat: SecurityThreat): Promise<void> {
    console.error(`🚨 SECURITY THREAT DETECTED: ${threat.threatType.toUpperCase()}`, {
      threatId: threat.threatId,
      severity: threat.severity,
      userId: threat.userId,
      description: threat.description
    });
  }
}

interface UserActivityTracker {
  userId: string;
  failedAttempts: number;
  lastFailedAttempt?: Date;
  lastSuccessfulAuth?: Date;
  lastIpAddress?: string;
  apiCalls: Array<{ timestamp: Date; service: string; endpoint: string }>;
  dataAccess: Array<{ timestamp: Date; collection: string; recordCount: number }>;
}

export const securityMonitor = SecurityMonitor.getInstance();