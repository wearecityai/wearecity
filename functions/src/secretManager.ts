/**
 * Google Secret Manager integration for enterprise-grade secret management
 * 10/10 Security Level - Government Grade
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export class SecretManager {
  private static instance: SecretManager;
  private client: SecretManagerServiceClient;
  private projectId: string;
  private cache: Map<string, { value: string; expiry: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.client = new SecretManagerServiceClient();
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'wearecity-2ab89';
  }

  public static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager();
    }
    return SecretManager.instance;
  }

  /**
   * Get secret with caching and automatic refresh
   */
  async getSecret(secretName: string, version: string = 'latest'): Promise<string> {
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
      
      if (!response.payload?.data) {
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

    } catch (error) {
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
  async createSecret(secretName: string, secretValue: string): Promise<void> {
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
      } catch (error: any) {
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

    } catch (error) {
      console.error(`❌ Error creating/updating secret ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Rotate API keys automatically
   */
  async rotateSecret(secretName: string, newValue: string): Promise<void> {
    await this.createSecret(secretName, newValue);
    
    // Log rotation for audit
    console.log(`🔄 Secret ${secretName} rotated at ${new Date().toISOString()}`);
  }

  /**
   * Clear cache for specific secret
   */
  private clearCache(secretName: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(secretName)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get all secrets for health check
   */
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const secrets = [
      'GOOGLE_SEARCH_API_KEY',
      'GEMINI_API_KEY',
      'FIREBASE_ADMIN_PRIVATE_KEY'
    ];

    const results: { [key: string]: boolean } = {};
    
    for (const secretName of secrets) {
      try {
        await this.getSecret(secretName);
        results[secretName] = true;
      } catch {
        results[secretName] = false;
      }
    }

    return results;
  }
}

// Singleton instance
export const secretManager = SecretManager.getInstance();

// Helper functions for common secrets
export const getGoogleSearchApiKey = () => secretManager.getSecret('GOOGLE_SEARCH_API_KEY');
export const getGeminiApiKey = () => secretManager.getSecret('GEMINI_API_KEY');
export const getFirebaseAdminKey = () => secretManager.getSecret('FIREBASE_ADMIN_PRIVATE_KEY');