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
    
    try {
      this.logActivity('Processing with Thirdweb Nebula API', { 
        taskId, 
        description: description?.substring(0, 100)
      });

      if (!this.thirdwebSecretKey) {
        return this.createTaskResponse(taskId, false, 'Thirdweb secret key is not configured');
      }

      // Build request for Thirdweb AI API with session signer support
      const walletAddress = parameters?.walletAddress || parameters?.address || parameters?.userId;
      
      // Get session signer for universal transaction signing
      let sessionSigner = null;
      if (walletAddress) {
        const sessionData = this.sessionManager.getSessionKey(walletAddress);
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
          ...(walletAddress && { from: walletAddress }),
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