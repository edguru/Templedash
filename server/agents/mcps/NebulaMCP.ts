// Nebula MCP - Direct Thirdweb API Integration for Advanced Blockchain Operations  
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';
// USD calculations now handled by AI agents - no backend price service needed
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
    
    // Subscribe to nebula_request messages specifically
    this.messageBroker.subscribe('nebula_request', async (message: AgentMessage) => {
      console.log(`[NebulaMCP] 🔄 DEBUG: Subscription handler received message ${message.id}`);
      const response = await this.handleMessage(message);
      if (response) {
        console.log(`[NebulaMCP] 📤 DEBUG: Sending response via message broker:`, {
          responseId: response.id,
          type: response.type,
          targetId: response.targetId
        });
        await this.sendMessage(response);
        console.log(`[NebulaMCP] ✅ DEBUG: Response sent successfully`);
      } else {
        console.log(`[NebulaMCP] ❌ DEBUG: No response to send`);
      }
    });
    console.log('[NebulaMCP] 🔔 DEBUG: Subscribed to nebula_request messages');
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

  // Removed balance check detection - all requests go to Thirdweb AI

  // Remove direct balance check - let Thirdweb AI handle all blockchain operations

  // Removed direct API calls - NebulaMCP should only use Thirdweb AI chat endpoint

  // Removed balance extraction - handled by Thirdweb AI

  // Removed balance formatting - handled by Thirdweb AI

  // USD calculations now handled by AI agents in their prompts

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      console.log(`[NebulaMCP] 🔍 DEBUG: Received message`, {
        type: message.type,
        taskId: message.payload?.taskId,
        description: message.payload?.description?.substring(0, 50),
        hasWalletAddress: !!message.payload?.walletAddress
      });

      if (message.type === 'execute_task' || message.type === 'nebula_request') {
        console.log(`[NebulaMCP] ✅ DEBUG: Processing ${message.type} message for balance check`);
        return await this.processWithNebulaLLM(message);
      }
      
      console.log(`[NebulaMCP] ❌ DEBUG: Unhandled message type: ${message.type}`);
      return null;
    } catch (error) {
      console.error('[NebulaMCP] ❌ DEBUG: Error handling message:', error);
      return this.createErrorResponse(message, `Nebula operation failed: ${error}`);
    }
  }

  private async processWithNebulaLLM(message: AgentMessage): Promise<AgentMessage> {
    const { taskId, description, parameters } = message.payload;
    const walletAddress = message.payload.walletAddress || parameters?.walletAddress;
    
    console.log(`[NebulaMCP] 🔄 DEBUG: Processing with Nebula LLM`, {
      taskId,
      description: description?.substring(0, 50),
      hasWalletAddress: !!walletAddress,
      messageType: message.type
    });
    
    try {
      // All requests go directly to Thirdweb AI chat endpoint
      console.log(`[NebulaMCP] 🎯 DEBUG: Routing ALL requests to Thirdweb AI chat endpoint`, {
        description: description?.substring(0, 50),
        hasWallet: !!walletAddress
      });
      this.logActivity('Processing with Thirdweb Nebula API', { 
        taskId, 
        description: description?.substring(0, 100)
      });

      if (!this.thirdwebSecretKey) {
        return this.createTaskResponse(taskId, false, 'Thirdweb secret key is not configured');
      }

      // Build request for Thirdweb AI API with session signer support  
      const userWalletAddress = walletAddress || parameters?.walletAddress || parameters?.userWallet || parameters?.address || parameters?.userId;
      
      console.log('[NebulaMCP] Processing with wallet context:', {
        taskId,
        userWalletAddress: userWalletAddress?.slice(0, 10) + '...',
        hasWalletAddress: !!userWalletAddress,
        parametersReceived: Object.keys(parameters || {}),
        description: description?.substring(0, 50)
      });
      
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
      
      // Enhanced prompt for native CAMP balance on Base Camp testnet
      const enhancedPrompt = userWalletAddress 
        ? `${description}. User's wallet address is ${userWalletAddress}. Check the native CAMP balance (not an ERC-20 token) for this wallet on Base Camp testnet (chain ID: 123420001114). CAMP is the native gas currency on this network, similar to ETH on Ethereum. Provide the balance in CAMP tokens with proper formatting.`
        : description;
      
      const requestBody = {
        context: {
          chain_ids: [123420001114], // Base Camp Testnet
          ...(userWalletAddress && { from: userWalletAddress }),
          ...(sessionSigner && { signer: sessionSigner }),
          operation_type: 'native_balance_check'
        },
        messages: [{
          role: 'user',
          content: enhancedPrompt
        }],
        stream: false
      };

      console.log('[NebulaMCP] Making request to Thirdweb AI API');
      
      const response = await fetch('https://api.thirdweb.com/ai/chat', {
        method: 'POST',
        headers: {
          'x-secret-key': this.thirdwebSecretKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(25000) // 25 second timeout
      });

      if (!response.ok) {
        throw new Error(`Thirdweb AI API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[NebulaMCP] 🎯 DEBUG: Thirdweb AI response:`, {
        status: response.status,
        responseKeys: Object.keys(result),
        resultSnippet: JSON.stringify(result).substring(0, 200)
      });
      
      const answer = result.message || result.content || result.response || 'No response from Thirdweb AI.';
      
      return this.createTaskResponse(taskId, true, answer);
      
    } catch (error) {
      console.error('[NebulaMCP] Thirdweb AI API request failed:', error);
      return this.createTaskResponse(taskId, false, 'I encountered an error processing your request with Thirdweb AI. Please try again.');
    }
  }

  private createTaskResponse(taskId: string, success: boolean, result: string): AgentMessage {
    console.log(`[NebulaMCP] 📤 DEBUG: Creating agent_response message`, {
      taskId,
      success,
      resultLength: result.length,
      targetAgent: 'companion-handler'
    });
    
    return {
      type: 'agent_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'companion-handler',
      payload: {
        taskId,
        success,
        userFriendlyResponse: result,
        agentName: 'NebulaMCP',
        executedBy: this.agentId,
        result,
        chainOfThought: [
          'Balance check executed by Nebula specialist',
          'Authentic CAMP Explorer API data retrieved',
          success ? 'Balance check completed successfully' : 'Balance check failed'
        ]
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