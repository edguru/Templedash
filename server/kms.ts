// AWS KMS Secret Management Service
import { KMSClient, EncryptCommand, DecryptCommand, CreateKeyCommand } from '@aws-sdk/client-kms';
import { SecretsManagerClient, CreateSecretCommand, GetSecretValueCommand, UpdateSecretCommand, DeleteSecretCommand } from '@aws-sdk/client-secrets-manager';
import crypto from 'crypto';

interface UserSecret {
  id: string;
  userId: string;
  secretName: string;
  secretType: 'api_key' | 'private_key' | 'session_key' | 'oauth_token';
  description: string;
  encrypted: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

interface SessionKeyData {
  address: string;
  privateKey: string;
  permissions: string[];
  expiresAt: Date;
  userId: string;
}

export class KMSSecretManager {
  private kmsClient: KMSClient;
  private secretsClient: SecretsManagerClient;
  private keyId: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    const kmsConfig = {
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    };

    this.kmsClient = new KMSClient(kmsConfig);
    this.secretsClient = new SecretsManagerClient(kmsConfig);
    this.keyId = process.env.AWS_KMS_KEY_ID || '';
    
    this.initialize();
  }

  private async initialize() {
    try {
      // Create KMS key if not exists
      if (!this.keyId) {
        await this.createKMSKey();
      }
      console.log('[KMS] Secret manager initialized with key:', this.keyId?.slice(0, 8) + '...');
    } catch (error) {
      console.error('[KMS] Initialization error:', error);
      // Fallback to local encryption if AWS is not configured
      console.log('[KMS] Falling back to local encryption');
    }
  }

  private async createKMSKey() {
    try {
      const command = new CreateKeyCommand({
        Description: 'Puppets AI Secret Encryption Key',
        Usage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT'
      });

      const response = await this.kmsClient.send(command);
      this.keyId = response.KeyMetadata?.KeyId || '';
      console.log('[KMS] Created new KMS key:', this.keyId);
    } catch (error) {
      console.error('[KMS] Error creating KMS key:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data using KMS
   */
  async encryptData(plaintext: string): Promise<string> {
    if (!this.keyId) {
      // Fallback to local encryption
      return this.localEncrypt(plaintext);
    }

    try {
      const command = new EncryptCommand({
        KeyId: this.keyId,
        Plaintext: Buffer.from(plaintext, 'utf-8')
      });

      const response = await this.kmsClient.send(command);
      return Buffer.from(response.CiphertextBlob!).toString('base64');
    } catch (error) {
      console.error('[KMS] Encryption error:', error);
      return this.localEncrypt(plaintext);
    }
  }

  /**
   * Decrypt sensitive data using KMS
   */
  async decryptData(ciphertext: string): Promise<string> {
    if (!this.keyId) {
      // Fallback to local decryption
      return this.localDecrypt(ciphertext);
    }

    try {
      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(ciphertext, 'base64')
      });

      const response = await this.kmsClient.send(command);
      return Buffer.from(response.Plaintext!).toString('utf-8');
    } catch (error) {
      console.error('[KMS] Decryption error:', error);
      return this.localDecrypt(ciphertext);
    }
  }

  /**
   * Store user secret in AWS Secrets Manager
   */
  async storeUserSecret(userId: string, secretName: string, secretValue: string, secretType: string, description: string): Promise<string> {
    const secretId = `puppets-ai/${userId}/${secretName}`;
    
    try {
      // Encrypt the secret value
      const encryptedValue = await this.encryptData(secretValue);
      
      const secretData = {
        value: encryptedValue,
        type: secretType,
        description,
        userId,
        createdAt: new Date().toISOString(),
        encrypted: true
      };

      const command = new CreateSecretCommand({
        Name: secretId,
        Description: `${description} for user ${userId}`,
        SecretString: JSON.stringify(secretData)
      });

      await this.secretsClient.send(command);
      console.log('[KMS] Stored secret:', secretId);
      return secretId;
    } catch (error) {
      console.error('[KMS] Error storing secret:', error);
      throw new Error(`Failed to store secret: ${error.message}`);
    }
  }

  /**
   * Retrieve user secret from AWS Secrets Manager
   */
  async getUserSecret(userId: string, secretName: string): Promise<string | null> {
    const secretId = `puppets-ai/${userId}/${secretName}`;
    
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretId
      });

      const response = await this.secretsClient.send(command);
      if (!response.SecretString) return null;

      const secretData = JSON.parse(response.SecretString);
      const decryptedValue = await this.decryptData(secretData.value);
      
      return decryptedValue;
    } catch (error) {
      console.error('[KMS] Error retrieving secret:', error);
      return null;
    }
  }

  /**
   * Update user secret
   */
  async updateUserSecret(userId: string, secretName: string, newValue: string): Promise<void> {
    const secretId = `puppets-ai/${userId}/${secretName}`;
    
    try {
      // Get existing secret to preserve metadata
      const existingSecret = await this.getUserSecret(userId, secretName);
      if (!existingSecret) {
        throw new Error('Secret not found');
      }

      const encryptedValue = await this.encryptData(newValue);
      
      const command = new UpdateSecretCommand({
        SecretId: secretId,
        SecretString: JSON.stringify({
          value: encryptedValue,
          updatedAt: new Date().toISOString(),
          encrypted: true
        })
      });

      await this.secretsClient.send(command);
      console.log('[KMS] Updated secret:', secretId);
    } catch (error) {
      console.error('[KMS] Error updating secret:', error);
      throw error;
    }
  }

  /**
   * Delete user secret
   */
  async deleteUserSecret(userId: string, secretName: string): Promise<void> {
    const secretId = `puppets-ai/${userId}/${secretName}`;
    
    try {
      const command = new DeleteSecretCommand({
        SecretId: secretId,
        ForceDeleteWithoutRecovery: true
      });

      await this.secretsClient.send(command);
      console.log('[KMS] Deleted secret:', secretId);
    } catch (error) {
      console.error('[KMS] Error deleting secret:', error);
      throw error;
    }
  }

  /**
   * Store session key securely
   */
  async storeSessionKey(userId: string, sessionData: SessionKeyData): Promise<string> {
    const sessionId = `session-${userId}-${Date.now()}`;
    
    try {
      const encryptedPrivateKey = await this.encryptData(sessionData.privateKey);
      
      const secureSessionData = {
        ...sessionData,
        privateKey: encryptedPrivateKey,
        encrypted: true
      };

      await this.storeUserSecret(
        userId, 
        sessionId, 
        JSON.stringify(secureSessionData), 
        'session_key', 
        'Blockchain session key'
      );

      return sessionId;
    } catch (error) {
      console.error('[KMS] Error storing session key:', error);
      throw error;
    }
  }

  /**
   * Retrieve session key securely
   */
  async getSessionKey(userId: string, sessionId: string): Promise<SessionKeyData | null> {
    try {
      const secretValue = await this.getUserSecret(userId, sessionId);
      if (!secretValue) return null;

      const sessionData = JSON.parse(secretValue);
      const decryptedPrivateKey = await this.decryptData(sessionData.privateKey);
      
      return {
        ...sessionData,
        privateKey: decryptedPrivateKey,
        expiresAt: new Date(sessionData.expiresAt)
      };
    } catch (error) {
      console.error('[KMS] Error retrieving session key:', error);
      return null;
    }
  }

  /**
   * List user secrets (metadata only)
   */
  async listUserSecrets(userId: string): Promise<UserSecret[]> {
    // This would require implementing a database to track secret metadata
    // For now, return empty array - can be enhanced with DynamoDB integration
    return [];
  }

  // Fallback encryption methods for local development
  private localEncrypt(text: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('[KMS] Local encryption error:', error);
      return Buffer.from(text).toString('base64'); // Fallback to base64
    }
  }

  private localDecrypt(encryptedText: string): string {
    try {
      // Check if it's base64 fallback
      if (!encryptedText.includes(':')) {
        return Buffer.from(encryptedText, 'base64').toString('utf8');
      }

      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
      
      const [ivHex, encrypted] = encryptedText.split(':');
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('[KMS] Local decryption error:', error);
      return encryptedText; // Return as-is if decryption fails
    }
  }
}

// Global KMS instance
export const kmsManager = new KMSSecretManager();