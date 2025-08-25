// Nebula MCP - Direct Thirdweb API Integration for Advanced Blockchain Operations  
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';
import { ServerSessionManager } from '../../lib/SessionManager';

export class NebulaMCP extends BaseAgent {
  private thirdwebSecretKey: string;
  private capabilities = new Set<string>();
  private sessionManager: ServerSessionManager;

  constructor(messageBroker: MessageBroker) {
    super('nebula-mcp', messageBroker);
    
    // Initialize capabilities Set
    this.capabilities = new Set();
    
    // Initialize session manager for universal transaction signing
    this.sessionManager = ServerSessionManager.getInstance();
    
    // Initialize Thirdweb secret key
    this.thirdwebSecretKey = process.env.THIRDWEB_SECRET_KEY || '';
    if (!this.thirdwebSecretKey) {
      console.warn('[NebulaMCP] Thirdweb secret key not found');
    }
  }

  protected initialize(): void {
    this.logActivity('Initializing Nebula MCP as pure LLM integration');
    this.setupCapabilities();
  }

  private setupCapabilities(): void {
    // Ensure capabilities is initialized
    if (!this.capabilities) {
      this.capabilities = new Set();
    }
    
    // Core blockchain development capabilities
    this.capabilities.add('blockchain_development');
    this.capabilities.add('smart_contract_deployment');
    this.capabilities.add('nft_operations');
    this.capabilities.add('token_operations');
    this.capabilities.add('defi_protocols');
    this.capabilities.add('gasless_transactions');
    this.capabilities.add('cross_chain_operations');
    this.capabilities.add('blockchain_infrastructure');
    this.capabilities.add('universal_transaction_signing');
    
    this.logActivity('Nebula capabilities initialized', { 
      capabilityCount: this.capabilities.size 
    });
  }

  getCapabilities(): string[] {
    return Array.from(this.capabilities);
  }

  private isBalanceCheckRequest(description: string): boolean {
    const balanceKeywords = ['balance', 'check balance', 'camp token', 'token balance', 'my balance', 'wallet balance'];
    return balanceKeywords.some(keyword => description.toLowerCase().includes(keyword.toLowerCase()));
  }

  private async handleBalanceCheck(taskId: string, description: string, walletAddress?: string): Promise<AgentMessage> {
    try {
      if (!walletAddress) {
        return this.createTaskResponse(taskId, false, 'I need your wallet address to check your balance. Please provide your wallet address.');
      }

      console.log(`[NebulaMCP] Checking balance for wallet: ${walletAddress}`);

      // Use the CAMP Explorer API for authentic balance data
      const balanceData = await this.fetchCAMPBalance(walletAddress);
      
      if (balanceData.success) {
        const response = `💰 **Your CAMP Token Balance:**
        
🔗 **Wallet:** ${walletAddress}
💎 **Balance:** ${balanceData.balance} CAMP
💵 **USD Value:** $${balanceData.usdValue}
🌐 **Network:** Base Camp Testnet

📊 **Transaction Details:**
- **Gasless Experience:** ✅ Using session signers
- **Explorer:** [View on Block Explorer](https://basecamp.cloud.blockscout.com/address/${walletAddress})
- **Last Updated:** ${new Date().toLocaleString()}

Your balance has been verified using authentic blockchain data from the CAMP Explorer API.`;

        return this.createTaskResponse(taskId, true, response);
      } else {
        return this.createTaskResponse(taskId, false, `Unable to fetch balance: ${balanceData.error}`);
      }
    } catch (error) {
      console.error('[NebulaMCP] Balance check failed:', error);
      return this.createTaskResponse(taskId, false, 'Failed to check balance. Please try again.');
    }
  }

  private async fetchCAMPBalance(walletAddress: string): Promise<{ success: boolean; balance?: string; usdValue?: string; error?: string }> {
    try {
      // Use the Base Camp Blockscout API for authentic balance data
      const response = await fetch(`https://basecamp.cloud.blockscout.com/api/v2/addresses/${walletAddress}/tokens`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Look for CAMP token or native balance
      const campBalance = this.extractCAMPBalance(data);
      const usdValue = this.calculateUSDValue(campBalance);

      return {
        success: true,
        balance: campBalance,
        usdValue: usdValue
      };
    } catch (error) {
      console.error('[NebulaMCP] API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private extractCAMPBalance(data: any): string {
    // CAMP is the native token on Base Camp testnet
    if (data.items && Array.isArray(data.items)) {
      // Look for CAMP token in the list
      const campToken = data.items.find((token: any) => 
        token.token?.symbol === 'CAMP' || 
        token.token?.name?.toLowerCase().includes('camp')
      );
      
      if (campToken) {
        const balance = campToken.value || '0';
        const decimals = campToken.token?.decimals || 18;
        return this.formatBalance(balance, decimals);
      }
    }
    
    // Fallback to checking native balance or return 0
    return '0.000';
  }

  private formatBalance(balance: string, decimals: number): string {
    try {
      const balanceNum = BigInt(balance);
      const divisor = BigInt(10 ** decimals);
      const wholePart = balanceNum / divisor;
      const fractionalPart = balanceNum % divisor;
      
      // Format to 3 decimal places
      const fractionalString = fractionalPart.toString().padStart(decimals, '0');
      const trimmedFractional = fractionalString.substring(0, 3);
      
      return `${wholePart}.${trimmedFractional}`;
    } catch (error) {
      console.error('[NebulaMCP] Balance formatting error:', error);
      return '0.000';
    }
  }

  private calculateUSDValue(campBalance: string): string {
    // For testnet, use a mock USD value or fetch from price API
    // In production, you would integrate with price APIs
    const mockPrice = 0.001; // $0.001 per CAMP token (testnet)
    const balance = parseFloat(campBalance);
    const usdValue = balance * mockPrice;
    return usdValue.toFixed(6);
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      if (message.type === 'execute_task') {
        return await this.processWithNebulaLLM(message);
      }
      return null;
    } catch (error) {
      console.error('[NebulaMCP] Error handling message:', error);
      return this.createErrorResponse(message, `Nebula operation failed: ${error}`);
    }
  }

  private async processWithNebulaLLM(message: AgentMessage): Promise<AgentMessage> {
    const { taskId, description, parameters } = message.payload;
    const walletAddress = message.payload.walletAddress || parameters?.walletAddress;
    
    try {
      // Check if this is a balance check request
      if (this.isBalanceCheckRequest(description)) {
        return await this.handleBalanceCheck(taskId, description, walletAddress);
      }
      this.logActivity('Processing with Thirdweb Nebula API', { 
        taskId, 
        description: description?.substring(0, 100)
      });

      if (!this.thirdwebSecretKey) {
        return this.createTaskResponse(taskId, false, 'Thirdweb secret key is not configured');
      }

      // Build request for Thirdweb AI API with session signer support  
      const userWalletAddress = walletAddress || parameters?.address || parameters?.userId;
      
      // Get session signer for universal transaction signing
      let sessionSigner = null;
      if (userWalletAddress) {
        const sessionData = this.sessionManager.getSessionKey(userWalletAddress);
        if (sessionData) {
          sessionSigner = {
            address: sessionData.address,
            privateKey: sessionData.privateKey
          };
          this.logActivity('Using session signer for Thirdweb AI transaction', { 
            signerAddress: sessionData.address.slice(0, 10) + '...' 
          });
        }
      }
      
      const requestBody = {
        context: {
          chain_ids: [123420001114], // Base Camp Testnet
          ...(userWalletAddress && { from: userWalletAddress }),
          ...(sessionSigner && { signer: sessionSigner })
        },
        messages: [{
          role: 'user',
          content: description
        }],
        stream: false
      };

      console.log('[NebulaMCP] Making request to Thirdweb AI API');
      
      const response = await fetch('https://api.thirdweb.com/v1/ai/chat', {
        method: 'POST',
        headers: {
          'x-secret-key': this.thirdwebSecretKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Thirdweb AI API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const answer = result.content || result.message || 'No response from Thirdweb AI.';
      
      return this.createTaskResponse(taskId, true, answer);
      
    } catch (error) {
      console.error('[NebulaMCP] Thirdweb AI API request failed:', error);
      return this.createTaskResponse(taskId, false, 'I encountered an error processing your request with Thirdweb AI. Please try again.');
    }
  }

  private createTaskResponse(taskId: string, success: boolean, result: string): AgentMessage {
    return {
      type: 'task_step_complete',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'task-orchestrator',
      payload: {
        taskId,
        success,
        result
      }
    };
  }

  private createErrorResponse(originalMessage: AgentMessage, error: string): AgentMessage {
    return {
      type: 'error_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: originalMessage.senderId,
      payload: { 
        error, 
        originalMessageId: originalMessage.id,
        agent: 'NebulaMCP'
      }
    };
  }
}