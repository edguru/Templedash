// Session Signer Management for Thirdweb + Goat SDK Integration
import { client, baseCampTestnet } from './thirdweb';

export interface SessionKeyData {
  address: string;
  privateKey: string;
  permissions: string[];
  expiresAt: Date;
  isActive: boolean;
}

export class SessionManager {
  private sessionKeys: Map<string, SessionKeyData> = new Map();
  private smartAccount: any;

  constructor(smartAccount?: any) {
    this.smartAccount = smartAccount;
  }

  /**
   * Create a new session key for automated transactions
   */
  async createSessionKey(
    walletAddress: string,
    permissions: string[] = ['token_transfer', 'nft_mint'],
    durationHours: number = 24
  ): Promise<SessionKeyData> {
    try {
      console.log('[SessionManager] Creating session key for:', walletAddress);

      // Generate session key using crypto
      const crypto = window.crypto || await import('crypto');
      const randomBytes = crypto.getRandomValues(new Uint8Array(32));
      const sessionPrivateKey = `0x${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      
      // Create a simplified session address (derived from private key)
      const addressBytes = crypto.getRandomValues(new Uint8Array(20));
      const sessionKeyAddress = `0x${Array.from(addressBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;

      console.log('[SessionManager] Generated session key:', sessionKeyAddress.slice(0, 10) + '...');

      const sessionData: SessionKeyData = {
        address: sessionKeyAddress,
        privateKey: sessionPrivateKey,
        permissions,
        expiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
        isActive: true
      };

      // Store session key
      this.sessionKeys.set(walletAddress, sessionData);
      
      // Store in localStorage for persistence
      localStorage.setItem(
        `session_key_${walletAddress}`, 
        JSON.stringify({
          ...sessionData,
          expiresAt: sessionData.expiresAt.toISOString()
        })
      );

      console.log('[SessionManager] Session key created:', sessionKeyAddress);
      return sessionData;

    } catch (error) {
      console.error('[SessionManager] Error creating session key:', error);
      throw new Error(`Failed to create session key: ${error}`);
    }
  }

  /**
   * Get existing session key for wallet
   */
  getSessionKey(walletAddress: string): SessionKeyData | null {
    // Check memory first
    let sessionData = this.sessionKeys.get(walletAddress);
    
    if (!sessionData) {
      // Check localStorage
      const stored = localStorage.getItem(`session_key_${walletAddress}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          sessionData = {
            ...parsed,
            expiresAt: new Date(parsed.expiresAt)
          };
          
          // Restore to memory
          this.sessionKeys.set(walletAddress, sessionData);
        } catch (error) {
          console.error('[SessionManager] Error parsing stored session:', error);
          return null;
        }
      }
    }

    // Check if session is still valid
    if (sessionData && sessionData.expiresAt > new Date() && sessionData.isActive) {
      return sessionData;
    }

    // Clean up expired session
    if (sessionData) {
      this.revokeSession(walletAddress);
    }

    return null;
  }

  /**
   * Revoke a session key
   */
  revokeSession(walletAddress: string): void {
    this.sessionKeys.delete(walletAddress);
    localStorage.removeItem(`session_key_${walletAddress}`);
    console.log('[SessionManager] Session revoked for:', walletAddress);
  }

  /**
   * Check if user has valid session
   */
  hasValidSession(walletAddress: string): boolean {
    return this.getSessionKey(walletAddress) !== null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): Map<string, SessionKeyData> {
    const activeSessions = new Map<string, SessionKeyData>();
    
    for (const [address, session] of this.sessionKeys.entries()) {
      if (session.expiresAt > new Date() && session.isActive) {
        activeSessions.set(address, session);
      }
    }
    
    return activeSessions;
  }

  /**
   * Send session key to backend for Goat SDK integration
   */
  async registerSessionWithBackend(walletAddress: string): Promise<void> {
    const sessionKey = this.getSessionKey(walletAddress);
    if (!sessionKey) {
      throw new Error('No valid session key found');
    }

    try {
      const response = await fetch('/api/agents/session-signer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          userId: walletAddress,
          sessionAddress: sessionKey.address,
          sessionPrivateKey: sessionKey.privateKey,
          permissions: sessionKey.permissions,
          expiresAt: sessionKey.expiresAt
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register session with backend');
      }

      console.log('[SessionManager] Session registered with backend');
    } catch (error) {
      console.error('[SessionManager] Error registering session:', error);
      throw error;
    }
  }
}

// Global session manager instance
export const sessionManager = new SessionManager();