"use strict";
/**
 * Input validation and sanitization for Firebase Functions
 * Prevents XSS, injection attacks, and data corruption
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ValidationService = void 0;
class ValidationService {
    /**
     * Sanitize string input to prevent XSS and injection attacks
     */
    static sanitizeString(input, maxLength = 1000) {
        if (typeof input !== 'string') {
            throw new ValidationError('field', 'Must be a string', input);
        }
        // Remove potential script tags and dangerous characters
        let sanitized = input
            .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
        // Limit length
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        return sanitized;
    }
    /**
     * Validate and sanitize chat query
     */
    static validateChatQuery(query) {
        if (!query) {
            throw new ValidationError('query', 'Query is required');
        }
        const sanitizedQuery = this.sanitizeString(query, 2000);
        if (sanitizedQuery.length < 1) {
            throw new ValidationError('query', 'Query cannot be empty after sanitization');
        }
        // Check for potential prompt injection patterns
        const suspiciousPatterns = [
            /ignore\s+(?:all\s+)?(?:previous\s+)?(?:instructions?|prompts?|commands?)/i,
            /forget\s+(?:everything|all|instructions?)/i,
            /system\s*:\s*you\s+are\s+now/i,
            /pretend\s+(?:you\s+are|to\s+be)/i,
            /roleplay\s+as/i,
            /simulate\s+(?:being|a)/i
        ];
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(sanitizedQuery)) {
                console.warn('Potential prompt injection detected:', sanitizedQuery.substring(0, 100));
                // Don't block completely, but log for monitoring
            }
        }
        return sanitizedQuery;
    }
    /**
     * Validate search request
     */
    static validateSearchRequest(request) {
        if (!request || typeof request !== 'object') {
            throw new ValidationError('request', 'Request must be an object');
        }
        const validatedRequest = {};
        // Required query
        validatedRequest.query = this.validateChatQuery(request.query);
        // Optional numeric fields
        if (request.num !== undefined) {
            if (!Number.isInteger(request.num) || request.num < 1 || request.num > 10) {
                throw new ValidationError('num', 'Number of results must be between 1 and 10');
            }
            validatedRequest.num = request.num;
        }
        if (request.start !== undefined) {
            if (!Number.isInteger(request.start) || request.start < 1 || request.start > 100) {
                throw new ValidationError('start', 'Start index must be between 1 and 100');
            }
            validatedRequest.start = request.start;
        }
        // Optional string fields with validation
        if (request.language !== undefined) {
            const validLanguages = ['es', 'en', 'fr', 'de', 'it', 'pt', 'ca'];
            if (!validLanguages.includes(request.language)) {
                throw new ValidationError('language', 'Invalid language code');
            }
            validatedRequest.language = request.language;
        }
        if (request.country !== undefined) {
            const validCountries = ['ES', 'US', 'FR', 'DE', 'IT', 'PT', 'GB'];
            if (!validCountries.includes(request.country)) {
                throw new ValidationError('country', 'Invalid country code');
            }
            validatedRequest.country = request.country;
        }
        if (request.dateRestrict !== undefined) {
            const validDateRestricts = ['d1', 'w1', 'm1', 'y1', 'all'];
            if (!validDateRestricts.includes(request.dateRestrict)) {
                throw new ValidationError('dateRestrict', 'Invalid date restriction');
            }
            validatedRequest.dateRestrict = request.dateRestrict;
        }
        if (request.safe !== undefined) {
            const validSafeValues = ['active', 'off'];
            if (!validSafeValues.includes(request.safe)) {
                throw new ValidationError('safe', 'Invalid safe search value');
            }
            validatedRequest.safe = request.safe;
        }
        if (request.fileType !== undefined) {
            validatedRequest.fileType = this.sanitizeString(request.fileType, 10);
            // Only allow common file types
            const allowedFileTypes = ['pdf', 'doc', 'docx', 'txt', 'html', 'xml'];
            if (!allowedFileTypes.includes(validatedRequest.fileType.toLowerCase())) {
                throw new ValidationError('fileType', 'Invalid file type');
            }
        }
        if (request.siteSearch !== undefined) {
            validatedRequest.siteSearch = this.sanitizeString(request.siteSearch, 100);
            // Basic URL validation
            if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(validatedRequest.siteSearch)) {
                throw new ValidationError('siteSearch', 'Invalid site search domain');
            }
        }
        return validatedRequest;
    }
    /**
     * Validate city slug
     */
    static validateCitySlug(citySlug) {
        if (citySlug === undefined || citySlug === null) {
            return undefined;
        }
        if (typeof citySlug !== 'string') {
            throw new ValidationError('citySlug', 'City slug must be a string');
        }
        const sanitized = citySlug.trim().toLowerCase();
        // City slug should only contain letters, numbers, and hyphens
        if (!/^[a-z0-9-]+$/.test(sanitized)) {
            throw new ValidationError('citySlug', 'City slug contains invalid characters');
        }
        if (sanitized.length > 50) {
            throw new ValidationError('citySlug', 'City slug is too long');
        }
        return sanitized;
    }
    /**
     * Validate conversation history
     */
    static validateConversationHistory(history) {
        if (!history) {
            return [];
        }
        if (!Array.isArray(history)) {
            throw new ValidationError('conversationHistory', 'Conversation history must be an array');
        }
        if (history.length > 50) {
            throw new ValidationError('conversationHistory', 'Conversation history is too long');
        }
        return history.map((message, index) => {
            if (!message || typeof message !== 'object') {
                throw new ValidationError(`conversationHistory[${index}]`, 'Message must be an object');
            }
            if (!['user', 'assistant'].includes(message.role)) {
                throw new ValidationError(`conversationHistory[${index}].role`, 'Invalid message role');
            }
            return {
                role: message.role,
                content: this.sanitizeString(message.content, 5000),
                timestamp: message.timestamp || new Date().toISOString()
            };
        });
    }
    /**
     * Validate media URL
     */
    static validateMediaUrl(mediaUrl) {
        if (!mediaUrl) {
            return undefined;
        }
        if (typeof mediaUrl !== 'string') {
            throw new ValidationError('mediaUrl', 'Media URL must be a string');
        }
        // Basic URL validation
        try {
            const url = new URL(mediaUrl);
            if (!['http:', 'https:'].includes(url.protocol)) {
                throw new ValidationError('mediaUrl', 'Media URL must use HTTP or HTTPS');
            }
            return mediaUrl;
        }
        catch {
            throw new ValidationError('mediaUrl', 'Invalid media URL format');
        }
    }
    /**
     * Validate media type
     */
    static validateMediaType(mediaType) {
        if (!mediaType) {
            return undefined;
        }
        if (typeof mediaType !== 'string') {
            throw new ValidationError('mediaType', 'Media type must be a string');
        }
        const validTypes = ['image', 'document'];
        if (!validTypes.includes(mediaType)) {
            throw new ValidationError('mediaType', 'Invalid media type');
        }
        return mediaType;
    }
}
exports.ValidationService = ValidationService;
class ValidationError extends Error {
    constructor(field, message, value) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=validation.js.map