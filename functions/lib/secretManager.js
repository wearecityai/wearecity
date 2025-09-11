"use strict";
/**
 * Google Secret Manager integration for enterprise-grade secret management
 * 10/10 Security Level - Government Grade
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirebaseAdminKey = exports.getGeminiApiKey = exports.getGoogleSearchApiKey = exports.secretManager = exports.SecretManager = void 0;
const secret_manager_1 = require("@google-cloud/secret-manager");
class SecretManager {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.client = new secret_manager_1.SecretManagerServiceClient();
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'wearecity-2ab89';
    }
    static getInstance() {
        if (!SecretManager.instance) {
            SecretManager.instance = new SecretManager();
        }
        return SecretManager.instance;
    }
    /**
     * Get secret with caching and automatic refresh
     */
    async getSecret(secretName, version = 'latest') {
        var _a;
        const cacheKey = `${secretName}_${version}`;
        const now = Date.now();
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && now < cached.expiry) {
            return cached.value;
        }
        try {
            const name = `projects/${this.projectId}/secrets/${secretName}/versions/${version}`;
            const [response] = await this.client.accessSecretVersion({ name });
            if (!((_a = response.payload) === null || _a === void 0 ? void 0 : _a.data)) {
                throw new Error(`Secret ${secretName} not found or empty`);
            }
            const secretValue = response.payload.data.toString();
            // Cache the secret
            this.cache.set(cacheKey, {
                value: secretValue,
                expiry: now + this.CACHE_DURATION
            });
            console.log(`✅ Secret ${secretName} retrieved from Google Secret Manager`);
            return secretValue;
        }
        catch (error) {
            console.error(`❌ Error retrieving secret ${secretName}:`, error);
            // Fallback to environment variables for development
            const envValue = process.env[secretName];
            if (envValue) {
                console.warn(`⚠️ Using fallback environment variable for ${secretName}`);
                return envValue;
            }
            throw new Error(`Failed to retrieve secret ${secretName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create or update a secret
     */
    async createSecret(secretName, secretValue) {
        try {
            // First, try to create the secret
            try {
                await this.client.createSecret({
                    parent: `projects/${this.projectId}`,
                    secretId: secretName,
                    secret: {
                        replication: {
                            automatic: {},
                        },
                    },
                });
                console.log(`✅ Created secret ${secretName}`);
            }
            catch (error) {
                if (error.code !== 6) { // Already exists error
                    throw error;
                }
                console.log(`Secret ${secretName} already exists, updating...`);
            }
            // Add secret version
            await this.client.addSecretVersion({
                parent: `projects/${this.projectId}/secrets/${secretName}`,
                payload: {
                    data: Buffer.from(secretValue),
                },
            });
            console.log(`✅ Added version to secret ${secretName}`);
            // Clear cache for this secret
            this.clearCache(secretName);
        }
        catch (error) {
            console.error(`❌ Error creating/updating secret ${secretName}:`, error);
            throw error;
        }
    }
    /**
     * Rotate API keys automatically
     */
    async rotateSecret(secretName, newValue) {
        await this.createSecret(secretName, newValue);
        // Log rotation for audit
        console.log(`🔄 Secret ${secretName} rotated at ${new Date().toISOString()}`);
    }
    /**
     * Clear cache for specific secret
     */
    clearCache(secretName) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(secretName)) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Get all secrets for health check
     */
    async healthCheck() {
        const secrets = [
            'GOOGLE_SEARCH_API_KEY',
            'GEMINI_API_KEY',
            'FIREBASE_ADMIN_PRIVATE_KEY'
        ];
        const results = {};
        for (const secretName of secrets) {
            try {
                await this.getSecret(secretName);
                results[secretName] = true;
            }
            catch (_a) {
                results[secretName] = false;
            }
        }
        return results;
    }
}
exports.SecretManager = SecretManager;
// Singleton instance
exports.secretManager = SecretManager.getInstance();
// Helper functions for common secrets
const getGoogleSearchApiKey = () => exports.secretManager.getSecret('GOOGLE_SEARCH_API_KEY');
exports.getGoogleSearchApiKey = getGoogleSearchApiKey;
const getGeminiApiKey = () => exports.secretManager.getSecret('GEMINI_API_KEY');
exports.getGeminiApiKey = getGeminiApiKey;
const getFirebaseAdminKey = () => exports.secretManager.getSecret('FIREBASE_ADMIN_PRIVATE_KEY');
exports.getFirebaseAdminKey = getFirebaseAdminKey;
//# sourceMappingURL=secretManager.js.map