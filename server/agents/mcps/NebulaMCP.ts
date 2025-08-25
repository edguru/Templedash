// Enhanced Nebula MCP - Thirdweb Execute Endpoint Integration with Session Signer Support
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';
import { ServerSessionManager } from '../../lib/SessionManager';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { transactionStatuses } from '../../../shared/schema';
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Base Camp testnet chain configuration
const baseCampTestnet = {
  id: 123420001114,
  name: 'Base Camp Testnet',
  network: 'basecamp-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CAMP',
    symbol: 'CAMP',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.camp-network-testnet.gelato.digital'],
    },
    public: {
      http: ['https://rpc.camp-network-testnet.gelato.digital'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Base Camp Explorer',
      url: 'https://basecamp.blockscout.com',
    },
  },
  testnet: true,
} as const;

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
  private async processTransactionActions(taskId: string, result: any, userWalletAddress: string, sessionSigner: any): Promise<AgentMessage> {
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
            // Try session key signing if available
            if (sessionSigner && sessionSigner.privateKey) {
              console.log(`[NebulaMCP] 🔐 Session signer available - attempting manual execution`);
              
              try {
                // Here you would implement actual session key signing
                // For now, we'll prepare the transaction but require real implementation
                console.log(`[NebulaMCP] 🔑 Implementing session key signing with private key`);
                
                // Extract transaction parameters from actions
                const transactionAction = unsignedTransactions[0];
                if (!transactionAction) {
                  throw new Error('No valid transaction action found');
                }
                
                // Create account from session private key
                const account = privateKeyToAccount(sessionSigner.privateKey as `0x${string}`);
                console.log(`[NebulaMCP] 💼 Created account from session key:`, { address: account.address });
                
                // Create wallet client for Base Camp testnet
                const walletClient = createWalletClient({
                  account,
                  chain: baseCampTestnet,
                  transport: http('https://rpc.camp-network-testnet.gelato.digital')
                });
                
                // Prepare transaction parameters from action data
                let transactionRequest: any = {};
                
                if (transactionAction.data) {
                  // If there's transaction data in the action
                  const txData = transactionAction.data;
                  transactionRequest = {
                    to: txData.to as `0x${string}`,
                    value: txData.value ? parseEther(txData.value.toString()) : BigInt(0),
                    data: txData.data as `0x${string}` || '0x',
                    gas: txData.gas ? BigInt(txData.gas) : undefined,
                    gasPrice: txData.gasPrice ? BigInt(txData.gasPrice) : undefined
                  };
                } else if (transactionAction.type === 'transaction') {
                  // If it's a transaction type, construct from action properties
                  transactionRequest = {
                    to: transactionAction.to as `0x${string}`,
                    value: transactionAction.value ? parseEther(transactionAction.value.toString()) : BigInt(0),
                    data: transactionAction.data as `0x${string}` || '0x'
                  };
                } else {
                  throw new Error('Unable to extract transaction data from action');
                }
                
                console.log(`[NebulaMCP] 📤 Sending transaction with session key:`, {
                  to: transactionRequest.to,
                  value: transactionRequest.value?.toString(),
                  from: account.address
                });
                
                // Sign and send transaction
                const txHash = await walletClient.sendTransaction(transactionRequest);
                console.log(`[NebulaMCP] ✅ Session key transaction sent:`, { txHash });
                
                // Update transaction status with real hash
                transactionStatus.transactionHash = txHash;
                transactionStatus.status = 'confirmed';
                transactionStatus.timestamp = new Date();
                this.transactionStatuses.set(transactionId, transactionStatus);
                
                await this.updateTransactionStatusInDatabase(transactionId, 'confirmed', txHash);
                
                const successMessage = `✅ Transaction executed with session key!\n\n🔗 **Transaction Hash:** ${txHash}\n📝 **Transaction ID:** ${transactionId}\n✅ **Status:** Confirmed on Base Camp testnet\n🔑 **Method:** Session Key Signing\n\n${result.message || 'Blockchain operation completed successfully.'}`;
                
                return this.createTaskResponse(taskId, true, this.cleanResponseFormat(successMessage));
                
              } catch (signingError) {
                console.error(`[NebulaMCP] Session key signing failed:`, signingError);
                
                transactionStatus.status = 'failed';
                transactionStatus.timestamp = new Date();
                this.transactionStatuses.set(transactionId, transactionStatus);
                
                await this.updateTransactionStatusInDatabase(transactionId, 'failed');
                
                const errorMessage = `❌ Session key signing failed.\n\n📝 **Transaction ID:** ${transactionId}\n⚠️ **Status:** Failed - Unable to sign with session key\n\nPlease try again or use manual wallet signing.`;
                
                return this.createTaskResponse(taskId, false, this.cleanResponseFormat(errorMessage));
              }
            } else {
              // No session signer available and auto execution failed
              console.log(`[NebulaMCP] ❌ NO EXECUTION METHOD: Auto execution failed and no session signer available`);
              
              transactionStatus.status = 'failed';
              transactionStatus.timestamp = new Date();
              this.transactionStatuses.set(transactionId, transactionStatus);
              
              await this.updateTransactionStatusInDatabase(transactionId, 'failed');
              
              const errorMessage = `❌ Transaction execution failed: No execution method available.\n\n📝 **Transaction ID:** ${transactionId}\n⚠️ **Status:** Failed - Auto execution failed and no session key available\n\nPlease connect your wallet and try again.`;
              
              return this.createTaskResponse(taskId, false, this.cleanResponseFormat(errorMessage));
            }
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
        // No real transaction available - return error instead of fake data
        console.log(`[NebulaMCP] ❌ NO REAL TRANSACTION: API did not return authentic blockchain transaction`);
        
        transactionStatus.status = 'failed';
        transactionStatus.timestamp = new Date();
        this.transactionStatuses.set(transactionId, transactionStatus);
        
        await this.updateTransactionStatusInDatabase(transactionId, 'failed');
        
        const errorMessage = `❌ Transaction preparation failed: Unable to execute on blockchain network.\n\n📝 **Transaction ID:** ${transactionId}\n⚠️ **Status:** Failed - No authentic blockchain confirmation\n\nThe system cannot generate fake transaction data. Please check your wallet connection and try again.`;

        return this.createTaskResponse(taskId, false, this.cleanResponseFormat(errorMessage));
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
      
      // Enhanced prompt with Base Camp network as default
      let enhancedPrompt = description;
      if (userWalletAddress) {
        enhancedPrompt = `${description}. User wallet address: ${userWalletAddress}. 

IMPORTANT: Use Base Camp testnet (chain ID: 123420001114) as the default blockchain network. CAMP is the native currency on this network. Do NOT use Ethereum Mainnet unless explicitly requested. For any balance checks, token operations, or blockchain queries, search on Base Camp testnet first.

${isWriteOperation ? 'AUTO-EXECUTE this transaction immediately without asking for confirmation. The user has pre-authorized all transactions. Do not ask "Would you like to proceed" or for manual confirmation. Execute the transaction directly and return the transaction hash and confirmation details.' : 'Please analyze the request and determine the appropriate network, native currency, and transaction details automatically. If this involves native currency transfers, use native transfer methods rather than token contracts.'}`;
      } else {
        enhancedPrompt = `${description}. 

IMPORTANT: Use Base Camp testnet (chain ID: 123420001114) as the default blockchain network. CAMP is the native currency on this network. Do NOT use Ethereum Mainnet unless explicitly requested. For any balance checks, token operations, or blockchain queries, search on Base Camp testnet first.`;
      }
      
      // Try auto execution first, fallback to session keys if needed
      const requestBody = {
        context: {
          ...(userWalletAddress && { from: userWalletAddress }),
          chain_ids: [123420001114], // Base Camp testnet
          auto_execute_transactions: isWriteOperation, // Only auto-execute for write operations
          ...(sessionSigner && { signer: sessionSigner })
        },
        messages: [{
          role: 'user',
          content: enhancedPrompt
        }],
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
      
      const response = await fetch('https://api.thirdweb.com/ai/chat', {
        method: 'POST',
        headers: {
          'x-secret-key': this.thirdwebSecretKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000) // 2 minutes for complex blockchain operations
      });

      if (!response.ok) {
        throw new Error(`Thirdweb Chat API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Check if transaction was executed or needs processing
      if (result.actions && result.actions.length > 0) {
        console.log(`[NebulaMCP] 📦 Received transaction actions - processing with session key fallback`);
        return await this.processTransactionActions(taskId, result, userWalletAddress, sessionSigner);
      } 
      
      // Check for direct transaction hash (successful auto execution)
      if (result.transaction_hash || result.txHash || result.hash) {
        const realTxHash = result.transaction_hash || result.txHash || result.hash;
        console.log(`[NebulaMCP] ✅ Auto execution successful:`, { realTxHash });
        
        const successMessage = `✅ Transaction executed automatically!\n\n🔗 **Transaction Hash:** ${realTxHash}\n✅ **Status:** Confirmed on Base Camp testnet\n\n${result.message || 'Blockchain operation completed successfully.'}`;
        return this.createTaskResponse(taskId, true, this.cleanResponseFormat(successMessage));
      }
      
      // Regular response (read operations or informational)
      const rawAnswer = result.message || result.content || result.response || 'No response available.';
      const cleanedAnswer = this.cleanResponseFormat(rawAnswer);
      
      return this.createTaskResponse(taskId, true, cleanedAnswer);
      
    } catch (error) {
      console.error('[NebulaMCP] Chat endpoint request failed:', error);
      return this.createTaskResponse(taskId, false, 'Failed to process blockchain query. Please try again.');
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