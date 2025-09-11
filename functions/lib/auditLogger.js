"use strict";
/**
 * Enterprise-grade audit logging for government compliance
 * Tracks all security events and user actions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.AuditLogger = exports.AuditSeverity = exports.AuditEventType = void 0;
const admin = __importStar(require("firebase-admin"));
var AuditEventType;
(function (AuditEventType) {
    AuditEventType["AUTHENTICATION"] = "authentication";
    AuditEventType["AUTHORIZATION"] = "authorization";
    AuditEventType["DATA_ACCESS"] = "data_access";
    AuditEventType["DATA_MODIFICATION"] = "data_modification";
    AuditEventType["SECURITY_VIOLATION"] = "security_violation";
    AuditEventType["API_USAGE"] = "api_usage";
    AuditEventType["SYSTEM_EVENT"] = "system_event";
    AuditEventType["RATE_LIMIT"] = "rate_limit";
    AuditEventType["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
})(AuditEventType = exports.AuditEventType || (exports.AuditEventType = {}));
var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["LOW"] = "low";
    AuditSeverity["MEDIUM"] = "medium";
    AuditSeverity["HIGH"] = "high";
    AuditSeverity["CRITICAL"] = "critical";
})(AuditSeverity = exports.AuditSeverity || (exports.AuditSeverity = {}));
class AuditLogger {
    constructor() {
        this.db = admin.firestore();
    }
    static getInstance() {
        if (!AuditLogger.instance) {
            AuditLogger.instance = new AuditLogger();
        }
        return AuditLogger.instance;
    }
    /**
     * Log audit event with full traceability
     */
    async logEvent(event) {
        var _a;
        try {
            const fullEvent = Object.assign({ eventId: this.generateEventId(), eventType: event.eventType || AuditEventType.SYSTEM_EVENT, severity: event.severity || AuditSeverity.LOW, timestamp: new Date(), source: event.source || 'firebase-functions', action: event.action || 'unknown', success: (_a = event.success) !== null && _a !== void 0 ? _a : true, details: event.details || {} }, event);
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
        }
        catch (error) {
            console.error('❌ Failed to log audit event:', error);
            // Don't throw - logging failure shouldn't break main functionality
        }
    }
    /**
     * Log authentication events
     */
    async logAuthentication(userId, action, success, details = {}, req) {
        var _a;
        await this.logEvent({
            eventType: AuditEventType.AUTHENTICATION,
            severity: success ? AuditSeverity.LOW : AuditSeverity.HIGH,
            userId,
            action,
            success,
            details,
            ipAddress: this.extractIpAddress(req),
            userAgent: (_a = req === null || req === void 0 ? void 0 : req.headers) === null || _a === void 0 ? void 0 : _a['user-agent']
        });
    }
    /**
     * Log authorization violations
     */
    async logAuthorizationViolation(userId, resource, details = {}, req) {
        var _a;
        await this.logEvent({
            eventType: AuditEventType.AUTHORIZATION,
            severity: AuditSeverity.HIGH,
            userId,
            action: 'access_denied',
            resource,
            success: false,
            details,
            ipAddress: this.extractIpAddress(req),
            userAgent: (_a = req === null || req === void 0 ? void 0 : req.headers) === null || _a === void 0 ? void 0 : _a['user-agent']
        });
    }
    /**
     * Log suspicious activity
     */
    async logSuspiciousActivity(userId, action, details, req) {
        var _a;
        await this.logEvent({
            eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
            severity: AuditSeverity.CRITICAL,
            userId,
            action,
            success: false,
            details: Object.assign({ suspicionReason: details.reason }, details),
            ipAddress: this.extractIpAddress(req),
            userAgent: (_a = req === null || req === void 0 ? void 0 : req.headers) === null || _a === void 0 ? void 0 : _a['user-agent']
        });
    }
    /**
     * Log data access for compliance
     */
    async logDataAccess(userId, resource, action, recordCount) {
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
    async logRateLimitViolation(userId, service, details, req) {
        var _a;
        await this.logEvent({
            eventType: AuditEventType.RATE_LIMIT,
            severity: AuditSeverity.MEDIUM,
            userId,
            action: 'rate_limit_exceeded',
            resource: service,
            success: false,
            details,
            ipAddress: this.extractIpAddress(req),
            userAgent: (_a = req === null || req === void 0 ? void 0 : req.headers) === null || _a === void 0 ? void 0 : _a['user-agent']
        });
    }
    /**
     * Log API usage for cost monitoring
     */
    async logApiUsage(userId, service, cost, details = {}) {
        await this.logEvent({
            eventType: AuditEventType.API_USAGE,
            severity: AuditSeverity.LOW,
            userId,
            action: 'api_call',
            resource: service,
            success: true,
            details: Object.assign({ cost, currency: 'USD' }, details)
        });
    }
    /**
     * Query audit logs with filtering
     */
    async queryAuditLogs(filters) {
        let query = this.db.collectionGroup('events');
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
        return snapshot.docs.map(doc => doc.data());
    }
    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get date partition for efficient querying
     */
    getDatePartition(date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    /**
     * Extract IP address from request
     */
    extractIpAddress(req) {
        var _a, _b, _c, _d, _e, _f;
        if (!req)
            return undefined;
        return req.ip ||
            ((_a = req.connection) === null || _a === void 0 ? void 0 : _a.remoteAddress) ||
            ((_b = req.socket) === null || _b === void 0 ? void 0 : _b.remoteAddress) ||
            ((_e = (_d = (_c = req.headers) === null || _c === void 0 ? void 0 : _c['x-forwarded-for']) === null || _d === void 0 ? void 0 : _d.split(',')[0]) === null || _e === void 0 ? void 0 : _e.trim()) ||
            ((_f = req.headers) === null || _f === void 0 ? void 0 : _f['x-real-ip']);
    }
    /**
     * Send critical alerts (integrate with monitoring systems)
     */
    async sendCriticalAlert(event) {
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
    async getAuditStatistics(dateRange) {
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
exports.AuditLogger = AuditLogger;
exports.auditLogger = AuditLogger.getInstance();
//# sourceMappingURL=auditLogger.js.map