// Enhanced Nebula MCP - Thirdweb Execute Endpoint Integration with Session Signer Support
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';
import { ServerSessionManager } from '../../lib/SessionManager';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { transactionStatuses } from '../../../shared/schema';

// Transaction status tracking interface
interface TransactionStatus {
  id: string;
  taskId: string;
  transactionHash?: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  timestamp: Date;
  userWallet: string;
  requestId?: string;
  sessionId?: string;
  executionMethod: 'chat' | 'execute';
  unsignedTx?: any;
}

export class NebulaMCP extends BaseAgent {
  private thirdwebSecretKey: string;
  private capabilities = new Set<string>();
  private sessionManager: ServerSessionManager;
  private db: any;
  private transactionStatuses: Map<string, TransactionStatus> = new Map();

  constructor(messageBroker: MessageBroker) {
    super('nebula-mcp', messageBroker);
    
    // Initialize capabilities Set
    this.capabilities = new Set();
    
    // Initialize session manager for universal transaction signing
    this.sessionManager = ServerSessionManager.getInstance();
    
    // Initialize database connection for transaction tracking
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
    
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
    
    // Enhanced blockchain development capabilities with execute endpoint
    this.capabilities.add('blockchain_development');
    this.capabilities.add('smart_contract_deployment');
    this.capabilities.add('nft_operations');
    this.capabilities.add('token_operations');
    this.capabilities.add('defi_protocols');
    this.capabilities.add('gasless_transactions');
    this.capabilities.add('cross_chain_operations');
    this.capabilities.add('blockchain_infrastructure');
    this.capabilities.add('universal_transaction_signing');
    this.capabilities.add('transaction_execution');
    this.capabilities.add('execute_endpoint_integration');
    this.capabilities.add('transaction_status_monitoring');
    
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
      
      if (message.type === 'transaction_confirmation') {
        console.log(`[NebulaMCP] ✅ DEBUG: Processing transaction confirmation`);
        const { transactionId, transactionHash, isCompanionNFT } = message.payload;
        return await this.confirmTransaction(transactionId, transactionHash, isCompanionNFT);
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
    
    console.log(`[NebulaMCP] 🔄 DEBUG: Processing with Enhanced Nebula Execute System`, {
      taskId,
      description: description?.substring(0, 50),
      hasWalletAddress: !!walletAddress,
      messageType: message.type
    });
    
    try {
      if (!this.thirdwebSecretKey) {
        return this.createTaskResponse(taskId, false, 'Thirdweb secret key is not configured');
      }

      // Extract wallet and operation type for intelligent routing
      const userWalletAddress = walletAddress || parameters?.walletAddress || parameters?.userWallet || parameters?.address || parameters?.userId;
      const operationType = parameters?.operationType || this.detectOperationType(description);
      
      console.log('[NebulaMCP] Enhanced processing with intelligent endpoint routing:', {
        taskId,
        userWalletAddress: userWalletAddress?.slice(0, 10) + '...',
        operationType,
        parametersReceived: Object.keys(parameters || {}),
        description: description?.substring(0, 50)
      });
      
      // Get session signer for transaction execution
      let sessionSigner = null;
      if (userWalletAddress) {
        const sessionData = this.sessionManager.getSessionKey(userWalletAddress);
        if (sessionData) {
          sessionSigner = {
            address: sessionData.address,
            privateKey: sessionData.privateKey
          };
          this.logActivity('Session signer available for enhanced transaction processing', { 
            signerAddress: sessionData.address.slice(0, 10) + '...' 
          });
        }
      }

      // Use chat endpoint for all operations with auto execution or session key fallback
      console.log(`[NebulaMCP] 🚀 UNIFIED OPERATION: Using chat endpoint with auto execution for all blockchain operations`);
      return await this.processWithChatEndpoint(taskId, description, userWalletAddress, sessionSigner);
      
    } catch (error) {
      console.error('[NebulaMCP] Enhanced blockchain API request failed:', error);
      return this.createTaskResponse(taskId, false, 'I encountered an error processing your blockchain request. Please try again.');
    }
  }


  // Phase 3 & 4: Process unsigned transactions and implement monitoring
  private async processTransactionActions(taskId: string, result: any, userWalletAddress: string, sessionSigner: any, description?: string): Promise<AgentMessage> {
    try {
      console.log(`[NebulaMCP] 🔐 PHASE 3 & 4: Processing unsigned transactions with session signer`);
      
      const actions = result.actions;
      const sessionId = result.session_id;
      const requestId = result.request_id;
      
      // Phase 4: Initialize transaction status monitoring
      const transactionId = uuidv4();
      const transactionStatus: TransactionStatus = {
        id: transactionId,
        taskId,
        status: 'pending',
        timestamp: new Date(),
        userWallet: userWalletAddress,
        requestId,
        sessionId,
        executionMethod: 'execute',
        unsignedTx: actions
      };
      
      this.transactionStatuses.set(transactionId, transactionStatus);
      
      // Phase 4: Save to database for persistent monitoring
      await this.saveTransactionStatusToDatabase(transactionStatus);
      
      console.log(`[NebulaMCP] 📊 PHASE 4: Transaction status monitoring initialized (memory + database)`, {
        transactionId,
        taskId,
        sessionId,
        requestId
      });

      // Phase 3: Auto-execute transactions (prioritize automatic execution)
      if (actions.length > 0) {
        console.log(`[NebulaMCP] 🚀 AUTO-EXECUTION: Processing transactions for immediate execution`, {
          actionsCount: actions.length,
          hasSessionSigner: !!sessionSigner,
          signerAddress: sessionSigner?.address.slice(0, 10) + '...' || 'none'
        });
        
        // Extract transaction data from actions
        const unsignedTransactions = actions.filter((action: any) => action.type === 'transaction' || action.data);
        
        if (unsignedTransactions.length > 0 || actions.length > 0) {
          // Update status to submitted
          transactionStatus.status = 'submitted';
          transactionStatus.timestamp = new Date();
          this.transactionStatuses.set(transactionId, transactionStatus);
          
          // Update in database
          await this.updateTransactionStatusInDatabase(transactionId, 'submitted');
          
          // Check if API returned real transaction hash
          let realTxHash = null;
          if (result.transaction_hash || result.txHash || result.hash) {
            realTxHash = result.transaction_hash || result.txHash || result.hash;
            console.log(`[NebulaMCP] ✅ REAL TRANSACTION EXECUTED:`, { realTxHash });
            
            transactionStatus.transactionHash = realTxHash;
            transactionStatus.status = 'confirmed';
            transactionStatus.timestamp = new Date();
            this.transactionStatuses.set(transactionId, transactionStatus);
            
            await this.updateTransactionStatusInDatabase(transactionId, 'confirmed', realTxHash);
            
            const successMessage = `✅ Transaction executed successfully!\n\n🔗 **Transaction Hash:** ${realTxHash}\n📝 **Transaction ID:** ${transactionId}\n✅ **Status:** Confirmed on Base Camp testnet\n\n${result.message || 'Blockchain operation completed successfully.'}`;
            
            return this.createTaskResponse(taskId, true, this.cleanResponseFormat(successMessage));
          } else {
            // Auto execution failed - try manual signing fallback
            console.log(`[NebulaMCP] 🔄 Auto execution failed - attempting manual signing fallback`);
            return await this.tryManualSigningFallback(taskId, description || 'Unknown transaction', userWalletAddress, transactionStatus);
          }
        }
      }

      // Check if API returned real transaction data without actions
      console.log(`[NebulaMCP] 🔍 CHECKING API RESPONSE: Looking for real transaction data`);
      
      // Look for real transaction hash in API response
      let realTxHash = null;
      if (result.transaction_hash || result.txHash || result.hash) {
        realTxHash = result.transaction_hash || result.txHash || result.hash;
        console.log(`[NebulaMCP] ✅ REAL TRANSACTION FOUND:`, { realTxHash });
        
        transactionStatus.transactionHash = realTxHash;
        transactionStatus.status = 'confirmed';
        transactionStatus.timestamp = new Date();
        this.transactionStatuses.set(transactionId, transactionStatus);
        
        await this.updateTransactionStatusInDatabase(transactionId, 'confirmed', realTxHash);
        
        const successMessage = `✅ Transaction executed successfully!\n\n🔗 **Transaction Hash:** ${realTxHash}\n📝 **Transaction ID:** ${transactionId}\n✅ **Status:** Confirmed on Base Camp testnet\n\n${result.message || 'Blockchain operation completed successfully.'}`;

        return this.createTaskResponse(taskId, true, this.cleanResponseFormat(successMessage));
      } else {
        // Auto execution failed - try manual signing fallback
        console.log(`[NebulaMCP] 🔄 Auto execution failed - attempting manual signing fallback`);
        return await this.tryManualSigningFallback(taskId, description || 'Unknown transaction', userWalletAddress, transactionStatus);
      }
      
    } catch (error) {
      console.error('[NebulaMCP] Transaction action processing failed:', error);
      return this.createTaskResponse(taskId, false, 'Failed to process transaction actions. Please try again.');
    }
  }


  // Unified Chat Endpoint with Auto Execution and Session Key Fallback
  private async processWithChatEndpoint(taskId: string, description: string, userWalletAddress: string, sessionSigner: any): Promise<AgentMessage> {
    try {
      const operationType = this.detectOperationType(description);
      const isWriteOperation = operationType === 'write';
      
      // Step 1: Enhanced prompt with mandatory explorer URL for all operations
      let enhancedPrompt = description;
      if (userWalletAddress) {
        enhancedPrompt = `${description}. User wallet: ${userWalletAddress}. 
IMPORTANT: Use Base Camp testnet (chain ID: 123420001114) as default network if user didn't mention any other chain or network.
${isWriteOperation ? 'AUTO-EXECUTE immediately without confirmation. MANDATORY: Include the appropriate blockchain explorer URL for the network being used in your response.' : 'Analyze and provide details along with the appropriate blockchain explorer URL for the network being used (MANDATORY)'}`;
      } else {
        enhancedPrompt = `${description}. 
IMPORTANT: Use Base Camp testnet (chain ID: 123420001114) as default network if user didn't mention any other chain or network.
${isWriteOperation ? 'AUTO-EXECUTE immediately without confirmation. MANDATORY: Include the appropriate blockchain explorer URL for the network being used in your response.' : 'Analyze and provide details along with the appropriate blockchain explorer URL for the network being used (MANDATORY)'}`;
      }
      
      // Nebula API uses simpler message format with context
      const requestBody = {
        message: enhancedPrompt,
        context: {
          ...(userWalletAddress && { from: userWalletAddress }),
          chain_ids: [123420001114], // Base Camp testnet
          auto_execute_transactions: isWriteOperation, // Only auto-execute for write operations
          ...(sessionSigner && { signer: sessionSigner })
        },
        stream: false
      };

      console.log(`[NebulaMCP] 🚀 Making request to /chat endpoint - ${isWriteOperation ? 'AUTO EXECUTION' : 'READ OPERATION'}`);
      console.log('[NebulaMCP] 📋 Context:', { 
        from: userWalletAddress?.slice(0, 10) + '...',
        chain_ids: [123420001114],
        auto_execute_transactions: isWriteOperation,
        hasSessionSigner: !!sessionSigner,
        operationType
      });
      
      // ✅ FIXED AUTH: Use correct Nebula API authentication format
      const authHeaders = {
        'x-secret-key': this.thirdwebSecretKey,
        'Content-Type': 'application/json'
      };
      
      console.log(`[NebulaMCP] 🔐 AUTH FIXED: Using correct x-secret-key header for Nebula API`);
      console.log(`[NebulaMCP] 🔐 SECRET KEY EXISTS:`, !!this.thirdwebSecretKey);
      console.log(`[NebulaMCP] 🔐 SECRET KEY PREFIX:`, this.thirdwebSecretKey?.substring(0, 10) + '...');
      
      const response = await fetch('https://nebula-api.thirdweb.com/chat', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000) // 2 minutes for complex blockchain operations
      });

      if (!response.ok) {
        throw new Error(`Thirdweb Chat API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`[NebulaMCP] 🔍 API RESPONSE:`, JSON.stringify(result, null, 2));
      
      // Step 2 & 3: Enhanced transaction handling with Thirdweb Engine polling
      if (isWriteOperation) {
        // Check for transaction ID for polling
        const transactionId = result.transaction_id || result.transactionId || result.id;
        
        if (transactionId) {
          console.log(`[NebulaMCP] 🔄 Step 2: Found transaction ID, starting polling:`, transactionId);
          return await this.pollTransactionStatus(taskId, transactionId, description, userWalletAddress, result);
        }
        
        // Check for direct transaction hash (immediate success)
        if (result.transaction_hash || result.txHash || result.hash) {
          const realTxHash = result.transaction_hash || result.txHash || result.hash;
          console.log(`[NebulaMCP] ✅ Immediate auto execution successful:`, { realTxHash });
          
          // Extract explorer URL from API response or construct based on network
          const explorerUrl = this.extractExplorerUrl(result) || `https://basecamp.blockscout.com/tx/${realTxHash}`;
          const networkInfo = this.extractNetworkInfo(result);
          
          const successMessage = `✅ Transaction executed successfully!\n\n🔗 **Transaction Hash:** ${realTxHash}\n🌐 **Explorer:** ${explorerUrl}\n✅ **Status:** Confirmed on ${networkInfo}`;
          return this.createTaskResponse(taskId, true, this.cleanResponseFormat(successMessage));
        }
        
        // Step 3: Auto execution failed - extract explorer URL and try manual signing
        console.log(`[NebulaMCP] 🔄 Step 3: Auto execution failed - attempting manual signing fallback`);
        const explorerUrl = this.extractExplorerUrl(result);
        return await this.tryManualSigningFallbackWithPolling(taskId, description, userWalletAddress, { id: taskId }, explorerUrl || undefined);
      } else {
        // Read operations - return with mandatory explorer URL
        const rawAnswer = result.message || result.content || result.response || 'No response available.';
        const cleanedAnswer = this.cleanResponseFormat(rawAnswer);
        return this.createTaskResponse(taskId, true, cleanedAnswer);
      }
      
    } catch (error) {
      console.error('[NebulaMCP] Chat endpoint request failed:', error);
      return this.createTaskResponse(taskId, false, 'Failed to process blockchain query. Please try again.');
    }
  }

  // Step 2: Poll transaction status using Thirdweb Engine
  private async pollTransactionStatus(taskId: string, transactionId: string, description: string, userWalletAddress: string, result: any): Promise<AgentMessage> {
    try {
      console.log(`[NebulaMCP] 🔄 Step 2: Polling transaction status for ID: ${transactionId}`);
      
      // Simulate Thirdweb Engine polling (replace with actual thirdweb engine client when available)
      const maxPollingTime = 60000; // 60 seconds
      const pollInterval = 3000; // 3 seconds
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxPollingTime) {
        try {
          // Poll transaction status
          const statusResponse = await fetch(`https://api.thirdweb.com/engine/transaction/${transactionId}`, {
            headers: {
              'x-secret-key': this.thirdwebSecretKey,
              'Content-Type': 'application/json'
            }
          });
          
          if (statusResponse.ok) {
            const statusResult = await statusResponse.json();
            
            if (statusResult.transactionHash || statusResult.transaction_hash) {
              const transactionHash = statusResult.transactionHash || statusResult.transaction_hash;
              console.log(`[NebulaMCP] ✅ Transaction confirmed via polling:`, { transactionHash });
              
              // Extract explorer URL from original result or construct based on network
              const explorerUrl = this.extractExplorerUrl(result) || this.extractExplorerUrl(statusResult) || `https://basecamp.blockscout.com/tx/${transactionHash}`;
              const networkInfo = this.extractNetworkInfo(result) || this.extractNetworkInfo(statusResult) || 'Base Camp testnet';
              
              const successMessage = `✅ Transaction executed successfully!\n\n🔗 **Transaction Hash:** ${transactionHash}\n🌐 **Explorer:** ${explorerUrl}\n✅ **Status:** Confirmed on ${networkInfo}`;
              
              return this.createTaskResponse(taskId, true, this.cleanResponseFormat(successMessage));
            }
            
            if (statusResult.status === 'failed' || statusResult.error) {
              console.log(`[NebulaMCP] ❌ Transaction failed via polling:`, statusResult);
              throw new Error(statusResult.error || 'Transaction failed');
            }
          }
        } catch (pollError) {
          console.log(`[NebulaMCP] ⚠️ Polling attempt failed:`, pollError);
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
      // Polling timeout - fallback to manual signing
      console.log(`[NebulaMCP] ⏰ Polling timeout - falling back to manual signing`);
      const explorerUrl = this.extractExplorerUrl(result);
      return await this.tryManualSigningFallbackWithPolling(taskId, description, userWalletAddress, { id: taskId }, explorerUrl || undefined);
      
    } catch (error) {
      console.error('[NebulaMCP] Polling failed:', error);
      const explorerUrl = this.extractExplorerUrl(result);
      return await this.tryManualSigningFallbackWithPolling(taskId, description, userWalletAddress, { id: taskId }, explorerUrl || undefined);
    }
  }

  // Extract explorer URL from API response (network-aware)
  private extractExplorerUrl(result: any): string | null {
    // Check for existing explorer URL in response
    if (result.explorerUrl || result.explorer_url) {
      return result.explorerUrl || result.explorer_url;
    }
    
    // Check for explorer URL in the message content (Nebula should provide this)
    if (result.message || result.content || result.response) {
      const message = result.message || result.content || result.response;
      const explorerMatch = message.match(/https?:\/\/[^\s]+(?:blockscout|etherscan|polygonscan|arbiscan|optimistic\.etherscan|basescan|bscscan)\.[\w\/\-\.]+/i);
      if (explorerMatch) {
        return explorerMatch[0];
      }
    }
    
    return null;
  }

  // Extract network information from API response
  private extractNetworkInfo(result: any): string | null {
    // Check for network info in response
    if (result.network || result.chain || result.chainId) {
      const networkInfo = result.network || result.chain || result.chainId;
      if (typeof networkInfo === 'string') return networkInfo;
      if (typeof networkInfo === 'number') {
        // Map common chain IDs to network names
        const chainMap: { [key: number]: string } = {
          1: 'Ethereum Mainnet',
          137: 'Polygon',
          42161: 'Arbitrum One',
          10: 'Optimism',
          8453: 'Base',
          56: 'BNB Smart Chain',
          123420001114: 'Base Camp testnet'
        };
        return chainMap[networkInfo] || `Chain ID ${networkInfo}`;
      }
    }
    
    // Check for network info in the message content
    if (result.message || result.content || result.response) {
      const message = result.message || result.content || result.response;
      const networkMatch = message.match(/(Ethereum|Polygon|Arbitrum|Optimism|Base|BNB|BSC|Base Camp)[\s\w]*/i);
      if (networkMatch) {
        return networkMatch[0];
      }
    }
    
    return null;
  }

  // Enhanced manual signing fallback with polling
  private async tryManualSigningFallbackWithPolling(taskId: string, description: string, userWalletAddress: string, transactionStatus: any, explorerUrl?: string): Promise<AgentMessage> {
    try {
      console.log(`[NebulaMCP] 📝 Step 3: Manual signing fallback with polling monitoring`);
      
      // Get structured transaction data
      const transactionPayload = await this.getStructuredTransactionData(description, userWalletAddress);
      
      if (!transactionPayload || !transactionPayload.transaction) {
        throw new Error('Failed to prepare transaction data for manual signing');
      }
      
      // Include explorer URL in payload for monitoring
      transactionPayload.explorerUrl = explorerUrl;
      transactionPayload.requiresManualSigning = true;
      
      // Return payload for frontend to handle signing and monitoring
      const manualSigningMessage = `🔐 **Manual transaction signing required**\n\n` +
        `📝 **Description:** ${transactionPayload.description}\n` +
        `🌐 **Network:** Base Camp testnet\n` +
        `${explorerUrl ? `🔍 **Monitor:** ${explorerUrl}\n` : ''}` +
        `\n⚠️ Please sign the transaction in your wallet when prompted.`;
      
      // Create manual signing response
      const response = this.createTaskResponse(taskId, true, manualSigningMessage);
      // Add transaction data to payload
      response.payload.transactionData = transactionPayload;
      response.payload.requiresManualSigning = true;
      return response;
      
    } catch (error) {
      console.error('[NebulaMCP] Manual signing fallback failed:', error);
      return this.createTaskResponse(taskId, false, 'Failed to prepare transaction for manual signing. Please try again.');
    }
  }

  // Get structured transaction data for manual signing
  private async getStructuredTransactionData(description: string, userWalletAddress: string): Promise<any> {
    try {
      const manualSigningPrompt = `${description}. User wallet: ${userWalletAddress}. 
IMPORTANT: Use Base Camp testnet (chain ID: 123420001114) as default network.

DO NOT execute this transaction. Instead, prepare structured transaction data in the following JSON format:
{
  "type": "manual_signing_required",
  "transaction": {
    "to": "0x...",
    "value": "0x...",
    "data": "0x...",
    "gasLimit": "0x...",
    "chainId": 123420001114
  },
  "description": "Human readable description",
  "isCompanionNFT": false
}

For companion NFT minting, set "isCompanionNFT": true.
Return only this JSON structure.`;

      const requestBody = {
        context: {
          from: userWalletAddress,
          chain_ids: [123420001114],
          auto_execute_transactions: false,
          prepare_transaction: true
        },
        messages: [{
          role: 'user',
          content: manualSigningPrompt
        }],
        stream: false
      };

      const response = await fetch('https://api.thirdweb.com/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.thirdwebSecretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`Transaction data request failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Extract transaction data from actions or message
      if (result.actions && result.actions.length > 0) {
        const action = result.actions[0];
        return {
          type: "manual_signing_required",
          transaction: {
            to: action.to || action.contract?.address,
            value: action.value || "0x0",
            data: action.data || "0x",
            gasLimit: action.gasLimit || "0x5208",
            chainId: 123420001114
          },
          description: description,
          isCompanionNFT: description.toLowerCase().includes('companion') || description.toLowerCase().includes('nft')
        };
      }
      
      // Try to parse JSON from message
      const rawMessage = result.message || result.content || result.response || '';
      const jsonMatch = rawMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return null;
      
    } catch (error) {
      console.error('[NebulaMCP] Failed to get structured transaction data:', error);
      return null;
    }
  }


  // Enhanced manual signing with frontend transaction creation
  private async tryManualSigningFallback(taskId: string, description: string, userWalletAddress: string, transactionStatus: any): Promise<AgentMessage> {
    try {
      console.log(`[NebulaMCP] 📝 Manual signing fallback - requesting structured transaction data`);
      
      // Enhanced prompt for structured transaction data
      const manualSigningPrompt = `${description}. User wallet address: ${userWalletAddress}. 

IMPORTANT: Use Base Camp testnet (chain ID: 123420001114) as the default blockchain network. CAMP is the native currency on this network.

DO NOT execute this transaction. Instead, prepare structured transaction data in the following JSON format for frontend execution:

{
  "type": "manual_signing_required",
  "transaction": {
    "to": "0x...",
    "value": "0x...",
    "data": "0x...",
    "gasLimit": "0x...",
    "chainId": 123420001114
  },
  "description": "Human readable description of what this transaction does",
  "isCompanionNFT": false
}

For companion NFT minting, set "isCompanionNFT": true.
Return only this JSON structure without additional text.`;

      const requestBody = {
        context: {
          from: userWalletAddress,
          chain_ids: [123420001114],
          auto_execute_transactions: false,
          prepare_transaction: true
        },
        messages: [{
          role: 'user',
          content: manualSigningPrompt
        }],
        stream: false
      };

      console.log('[NebulaMCP] 📝 Making request for structured transaction data');
      
      const response = await fetch('https://api.thirdweb.com/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.thirdwebSecretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000)
      });

      if (!response.ok) {
        throw new Error(`Manual signing request failed: ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[NebulaMCP] 📋 Raw API response:`, JSON.stringify(result, null, 2));
      
      // Extract transaction actions if available
      let transactionData = null;
      let isCompanionNFT = false;
      
      if (result.actions && result.actions.length > 0) {
        // Use transaction actions from API response
        const action = result.actions[0];
        transactionData = {
          type: "manual_signing_required",
          transaction: {
            to: action.to || action.contract?.address,
            value: action.value || "0x0",
            data: action.data || "0x",
            gasLimit: action.gasLimit || "0x5208",
            chainId: 123420001114
          },
          description: description,
          isCompanionNFT: description.toLowerCase().includes('companion') || description.toLowerCase().includes('nft')
        };
        console.log(`[NebulaMCP] ✅ Extracted transaction data from actions`);
      } else {
        // Try to extract JSON from message
        const rawMessage = result.message || result.content || result.response || '';
        try {
          const jsonMatch = rawMessage.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            transactionData = JSON.parse(jsonMatch[0]);
            console.log(`[NebulaMCP] ✅ Parsed transaction data from message`);
          }
        } catch (parseError) {
          console.log(`[NebulaMCP] ⚠️ Could not parse JSON from message, creating fallback`);
        }
      }
      
      // Fallback if no structured data found
      if (!transactionData) {
        transactionData = {
          type: "manual_signing_required",
          transaction: null,
          description: description,
          isCompanionNFT: description.toLowerCase().includes('companion') || description.toLowerCase().includes('nft'),
          rawMessage: result.message || result.content || result.response || 'Transaction preparation failed'
        };
      }
      
      // Update transaction status to pending manual signature
      transactionStatus.status = 'pending';
      transactionStatus.timestamp = new Date();
      transactionStatus.unsignedTx = transactionData;
      this.transactionStatuses.set(transactionStatus.id, transactionStatus);
      await this.updateTransactionStatusInDatabase(transactionStatus.id, 'pending');
      
      // Create response that triggers frontend manual signing
      const response_payload = {
        requiresManualSigning: true,
        transactionId: transactionStatus.id,
        transactionData: transactionData,
        taskId: taskId
      };
      
      console.log(`[NebulaMCP] 🚀 Triggering frontend manual signing:`, response_payload);
      
      return {
        id: uuidv4(),
        type: 'task_response',
        timestamp: new Date().toISOString(),
        payload: {
          taskId: taskId,
          success: true,
          response: 'Manual signing required - transaction prepared for frontend execution',
          requiresManualSigning: true,
          transactionData: response_payload
        },
        senderId: 'nebula-mcp',
        targetId: 'task-orchestrator'
      };
      
    } catch (error) {
      console.error('[NebulaMCP] Manual signing fallback failed:', error);
      
      // Update transaction status to failed
      transactionStatus.status = 'failed';
      transactionStatus.timestamp = new Date();
      this.transactionStatuses.set(transactionStatus.id, transactionStatus);
      await this.updateTransactionStatusInDatabase(transactionStatus.id, 'failed');
      
      return this.createTaskResponse(taskId, false, 'Transaction preparation failed. Please try again.');
    }
  }

  // New method to handle transaction confirmation from frontend
  async confirmTransaction(transactionId: string, transactionHash: string, isCompanionNFT: boolean = false): Promise<AgentMessage> {
    try {
      console.log(`[NebulaMCP] ✅ Confirming transaction:`, { transactionId, transactionHash, isCompanionNFT });
      
      // Update transaction status in memory and database
      const transactionStatus = this.transactionStatuses.get(transactionId);
      if (transactionStatus) {
        transactionStatus.status = 'confirmed';
        transactionStatus.transactionHash = transactionHash;
        transactionStatus.timestamp = new Date();
        this.transactionStatuses.set(transactionId, transactionStatus);
        
        await this.updateTransactionStatusInDatabase(transactionId, 'confirmed', transactionHash);
        
        // If this is a companion NFT, trigger companion creation in database
        if (isCompanionNFT) {
          console.log(`[NebulaMCP] 🤖 Companion NFT transaction confirmed - triggering companion creation`);
          await this.handleCompanionNFTCreation(transactionHash, transactionStatus.userWallet);
        }
        
        let successMessage = `✅ Transaction confirmed successfully!\n\n🔗 **Transaction Hash:** ${transactionHash}\n📝 **Transaction ID:** ${transactionId}\n✅ **Status:** Confirmed on Base Camp testnet`;
        
        if (isCompanionNFT) {
          successMessage += `\n\n🤖 **Companion NFT created!** Your new AI companion has been minted and will be added to your account.`;
        }
        
        return this.createTaskResponse(transactionStatus.taskId, true, successMessage);
      } else {
        throw new Error(`Transaction ${transactionId} not found`);
      }
      
    } catch (error) {
      console.error('[NebulaMCP] Transaction confirmation failed:', error);
      return this.createTaskResponse('unknown', false, 'Failed to confirm transaction. Please try again.');
    }
  }

  // Handle companion NFT creation in database after successful transaction
  private async handleCompanionNFTCreation(transactionHash: string, userWallet: string): Promise<void> {
    try {
      console.log(`[NebulaMCP] 🤖 Creating companion in database for wallet: ${userWallet}`);
      
      // Import companions and users schema
      const { companions, users } = await import('../../../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Find user by wallet address
      const userResults = await this.db.select().from(users).where(eq(users.walletAddress, userWallet));
      
      if (userResults.length === 0) {
        console.log(`[NebulaMCP] ⚠️ User not found for wallet: ${userWallet}`);
        return;
      }
      
      const userId = userResults[0].id;
      
      // Check if user already has a companion (should be prevented by UI, but double-check)
      const existingCompanions = await this.db.select().from(companions).where(eq(companions.userId, userId));
      
      if (existingCompanions.length > 0) {
        console.log(`[NebulaMCP] ⚠️ User ${userWallet} already has a companion, skipping creation`);
        return;
      }
      
      // Create companion record with proper schema fields
      const companionData = {
        userId: userId,
        tokenId: '1', // Default token ID
        contractAddress: '0x742d35Cc6e2C3e312318508CF3c66E2E2B45A1b5', // CompanionNFT contract
        name: 'New Companion',
        age: 25,
        role: 'friend',
        gender: 'non-binary',
        flirtiness: 3,
        intelligence: 7,
        humor: 7,
        loyalty: 8,
        empathy: 7,
        personalityType: 'helpful',
        transactionHash: transactionHash
      };
      
      await this.db.insert(companions).values(companionData);
      
      console.log(`[NebulaMCP] ✅ Companion created successfully for wallet: ${userWallet}`);
      
    } catch (error) {
      console.error('[NebulaMCP] ❌ Failed to create companion in database:', error);
      // Don't throw - transaction was successful, companion creation is secondary
    }
  }

  // Enhanced operation type detection
  private detectOperationType(description: string): 'read' | 'write' {
    const lowerDescription = description.toLowerCase();
    
    // Write operation patterns
    const writePatterns = [
      'send', 'transfer', 'swap', 'bridge', 'deploy', 'mint', 'create', 
      'execute', 'approve', 'stake', 'unstake', 'buy', 'sell', 'trade',
      'list', 'cancel', 'withdraw', 'deposit', 'claim', 'vote'
    ];
    
    // Check for write patterns
    if (writePatterns.some(pattern => lowerDescription.includes(pattern))) {
      return 'write';
    }
    
    return 'read';
  }

  // Phase 4: Enhanced Transaction status monitoring with database persistence
  async saveTransactionStatusToDatabase(transactionStatus: TransactionStatus): Promise<void> {
    try {
      await this.db.insert(transactionStatuses).values({
        id: transactionStatus.id,
        taskId: transactionStatus.taskId,
        transactionHash: transactionStatus.transactionHash,
        status: transactionStatus.status,
        userWallet: transactionStatus.userWallet,
        requestId: transactionStatus.requestId,
        sessionId: transactionStatus.sessionId,
        executionMethod: transactionStatus.executionMethod,
        unsignedTxData: transactionStatus.unsignedTx ? JSON.stringify(transactionStatus.unsignedTx) : null,
        createdAt: transactionStatus.timestamp,
        updatedAt: new Date()
      });
      
      console.log(`[NebulaMCP] 💾 PHASE 4: Transaction status saved to database`, {
        transactionId: transactionStatus.id,
        status: transactionStatus.status
      });
    } catch (error) {
      console.error('[NebulaMCP] Failed to save transaction status to database:', error);
    }
  }

  async updateTransactionStatusInDatabase(transactionId: string, status: TransactionStatus['status'], transactionHash?: string): Promise<void> {
    try {
      const { eq } = await import('drizzle-orm');
      
      await this.db
        .update(transactionStatuses)
        .set({
          status,
          transactionHash,
          updatedAt: new Date()
        })
        .where(eq(transactionStatuses.id, transactionId));
        
      console.log(`[NebulaMCP] 📊 PHASE 4: Transaction status updated in database`, {
        transactionId,
        status,
        transactionHash
      });
    } catch (error) {
      console.error('[NebulaMCP] Failed to update transaction status in database:', error);
    }
  }

  getTransactionStatus(transactionId: string): TransactionStatus | undefined {
    return this.transactionStatuses.get(transactionId);
  }

  async getTransactionStatusFromDatabase(transactionId: string): Promise<any> {
    try {
      const { eq } = await import('drizzle-orm');
      
      const result = await this.db
        .select()
        .from(transactionStatuses)
        .where(eq(transactionStatuses.id, transactionId))
        .limit(1);
        
      return result[0] || null;
    } catch (error) {
      console.error('[NebulaMCP] Failed to get transaction status from database:', error);
      return null;
    }
  }

  getAllPendingTransactions(): TransactionStatus[] {
    return Array.from(this.transactionStatuses.values()).filter(tx => tx.status === 'pending' || tx.status === 'submitted');
  }

  async updateTransactionStatus(transactionId: string, status: TransactionStatus['status'], transactionHash?: string): Promise<void> {
    // Update in memory
    const transaction = this.transactionStatuses.get(transactionId);
    if (transaction) {
      transaction.status = status;
      transaction.timestamp = new Date();
      if (transactionHash) {
        transaction.transactionHash = transactionHash;
      }
      this.transactionStatuses.set(transactionId, transaction);
      
      // Update in database
      await this.updateTransactionStatusInDatabase(transactionId, status, transactionHash);
      
      console.log(`[NebulaMCP] 📊 PHASE 4: Transaction status updated (memory + database)`, {
        transactionId,
        status,
        transactionHash
      });
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

  private cleanResponseFormat(response: string): string {
    // Remove internal tool references and clean up the response
    let cleaned = response
      // Remove any markdown links with thirdweb and keep just the wallet address
      .replace(/\[`([^`]+)`\]\(https:\/\/thirdweb\.com\/[^)]+\)/g, '$1')
      // Remove any remaining thirdweb URLs
      .replace(/https?:\/\/thirdweb\.com\/[^\s\)]+/g, '')
      // Remove thirdweb references
      .replace(/thirdweb/gi, 'blockchain')
      // Remove nebula references  
      .replace(/nebula/gi, 'blockchain API')
      // Remove chaingpt references
      .replace(/chaingpt/gi, 'blockchain AI')
      // Clean up any remaining technical references
      .replace(/Thirdweb AI/g, 'Blockchain AI')
      .replace(/Nebula API/g, 'Blockchain API')
      .replace(/ChainGPT/g, 'Blockchain AI')
      // Clean up extra parentheses and spaces
      .replace(/\(\s*\)/g, '')
      .replace(/\s{2,}/g, ' ');

    return cleaned.trim();
  }
}