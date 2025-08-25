// Server-side Session Manager for Agent System
import crypto from 'crypto';

export interface ServerSessionKeyData {
  address: string;
  privateKey: string;
  permissions: string[];
  expiresAt: Date;
  isActive: boolean;
}

export class ServerSessionManager {
  private static instance: ServerSessionManager;
  private sessionKeys: Map<string, ServerSessionKeyData> = new Map();

  private constructor() {}

  static getInstance(): ServerSessionManager {
    if (!ServerSessionManager.instance) {
      ServerSessionManager.instance = new ServerSessionManager();
    }
    return ServerSessionManager.instance;
  }

  /**
   * Create a new session key for automated transactions
   */
  async createSessionKey(
    walletAddress: string,
    permissions: string[] = ['universal_signer'],
    durationHours: number = 24
  ): Promise<ServerSessionKeyData> {
    try {
      console.log('[ServerSessionManager] Creating session key for:', walletAddress);

      // Generate session key using Node.js crypto
      const sessionPrivateKey = `0x${crypto.randomBytes(32).toString('hex')}`;
      const sessionKeyAddress = `0x${crypto.randomBytes(20).toString('hex')}`;

      const sessionData: ServerSessionKeyData = {
        address: sessionKeyAddress,
        privateKey: sessionPrivateKey,
        permissions,
        expiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
        isActive: true
      };

      // Store session key
      this.sessionKeys.set(walletAddress, sessionData);
      
      console.log('[ServerSessionManager] Session key created:', sessionKeyAddress.slice(0, 10) + '...');
      return sessionData;
    } catch (error) {
      console.error('[ServerSessionManager] Failed to create session key:', error);
      throw new Error(`Session key creation failed: ${error.message}`);
    }
  }

  /**
   * Get session key for a wallet address
   */
  getSessionKey(walletAddress: string): ServerSessionKeyData | null {
    const sessionData = this.sessionKeys.get(walletAddress);
    
    if (!sessionData) {
      return null;
    }

    // Check if session is still active and not expired
    if (!sessionData.isActive || new Date() > sessionData.expiresAt) {
      this.revokeSessionKey(walletAddress);
      return null;
    }

    return sessionData;
  }

  /**
   * Check if session key exists and is valid (universal permission)
   */
  hasPermission(walletAddress: string, permission?: string): boolean {
    const sessionData = this.getSessionKey(walletAddress);
    // With universal_signer, any valid session can sign any transaction
    return sessionData !== null && sessionData.isActive;
  }

  /**
   * Revoke session key
   */
  revokeSessionKey(walletAddress: string): boolean {
    const sessionData = this.sessionKeys.get(walletAddress);
    if (sessionData) {
      sessionData.isActive = false;
      console.log('[ServerSessionManager] Session key revoked for:', walletAddress);
      return true;
    }
    return false;
  }

  /**
   * Get all active session keys
   */
  getActiveSessions(): Map<string, ServerSessionKeyData> {
    const activeSessions = new Map<string, ServerSessionKeyData>();
    
    for (const [walletAddress, sessionData] of this.sessionKeys.entries()) {
      if (sessionData.isActive && new Date() <= sessionData.expiresAt) {
        activeSessions.set(walletAddress, sessionData);
      }
    }
    
    return activeSessions;
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): number {
    let cleanedCount = 0;
    const now = new Date();
    
    for (const [walletAddress, sessionData] of this.sessionKeys.entries()) {
      if (now > sessionData.expiresAt) {
        this.sessionKeys.delete(walletAddress);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[ServerSessionManager] Cleaned up ${cleanedCount} expired sessions`);
    }
    
    return cleanedCount;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): { total: number; active: number; expired: number } {
    let active = 0;
    let expired = 0;
    const now = new Date();
    
    for (const sessionData of this.sessionKeys.values()) {
      if (sessionData.isActive && now <= sessionData.expiresAt) {
        active++;
      } else {
        expired++;
      }
    }
    
    return {
      total: this.sessionKeys.size,
      active,
      expired
    };
  }
}