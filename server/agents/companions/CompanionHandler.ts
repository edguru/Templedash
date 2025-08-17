// Companion Handler Agent - Manages companion chat functionality
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage, ConversationContext, UserMessage } from '../types/AgentTypes';
import { ProfileMemory } from '../memory/ProfileMemory';
import { v4 as uuidv4 } from 'uuid';

export class CompanionHandler extends BaseAgent {
  constructor(messageBroker: MessageBroker, private profileMemory: ProfileMemory) {
    super('companion-handler', messageBroker);
  }

  protected initialize(): void {
    this.logActivity('Initializing Companion Handler');
    
    // Subscribe to user messages
    this.messageBroker.subscribe('user_message', async (message: AgentMessage) => {
      await this.handleMessage(message);
    });

    // Subscribe to task completion updates
    this.messageBroker.subscribe('task_complete', async (message: AgentMessage) => {
      await this.notifyTaskCompletion(message);
    });
  }

  getCapabilities(): string[] {
    return [
      'conversation_management',
      'context_awareness',
      'personality_adaptation',
      'user_engagement',
      'task_coordination'
    ];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      this.logActivity('Handling message', { type: message.type, from: message.senderId });

      if (message.type === 'user_message') {
        return await this.processUserMessage(message as UserMessage);
      }

      return null;
    } catch (error) {
      console.error('[CompanionHandler] Error handling message:', error);
      return this.createErrorResponse(message, 'Failed to process message');
    }
  }

  private async processUserMessage(userMessage: UserMessage): Promise<AgentMessage> {
    const { userId, payload } = userMessage;
    
    // Get user profile and context
    const userProfile = await this.profileMemory.getUserProfile(userId);
    const context = await this.buildConversationContext(userId, userMessage.conversationId);
    
    // Analyze message intent
    const intent = await this.analyzeIntent(payload.message);
    
    // Check if this requires task creation for blockchain operations
    const requiresTask = this.shouldCreateTask(intent);
    let taskId: string | null = null;
    
    if (requiresTask) {
      // Create task for blockchain operations
      taskId = await this.createBlockchainTask(userId, intent, payload.message, context);
    }
    
    // Generate contextual response
    const response = await this.generateResponse(payload.message, context, intent, taskId);
    
    // Store conversation in memory
    await this.profileMemory.addConversationMessage(userId, {
      role: 'user',
      content: payload.message,
      timestamp: userMessage.timestamp
    });
    
    await this.profileMemory.addConversationMessage(userId, {
      role: 'assistant', 
      content: response,
      timestamp: new Date().toISOString()
    });

    // Send response message
    const responseMessage: AgentMessage = {
      type: 'companion_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'user-experience',
      payload: {
        userId,
        conversationId: userMessage.conversationId,
        response,
        intent,
        taskId,
        requiresAction: requiresTask
      }
    };

    console.log('[CompanionHandler] Sending response:', {
      userId,
      intent,
      taskId,
      requiresAction: requiresTask,
      responsePreview: response?.substring(0, 100)
    });

    await this.sendMessage(responseMessage);
    return responseMessage;
  }

  private async buildConversationContext(userId: string, conversationId: string): Promise<ConversationContext> {
    const profile = await this.profileMemory.getUserProfile(userId);
    const recentMessages = await this.profileMemory.getConversationHistory(userId, 10);
    const activeTasks = await this.getActiveTasks(userId);

    return {
      conversationId,
      userId,
      companionPersonality: profile?.companionPersonality || 'helpful',
      recentMessages,
      activeTasks,
      userPreferences: profile?.preferences || {}
    };
  }

  private async analyzeIntent(message: string): Promise<string> {
    // Simple intent classification - could be enhanced with ML
    const lowerMessage = message.toLowerCase();
    
    // Nebula-specific intents
    if (lowerMessage.includes('mint') && lowerMessage.includes('nft')) {
      return 'mint_nft';
    }
    if (lowerMessage.includes('marketplace') || lowerMessage.includes('list') && lowerMessage.includes('nft')) {
      return 'list_marketplace';
    }
    if (lowerMessage.includes('gasless') || lowerMessage.includes('sponsor') || lowerMessage.includes('free transaction')) {
      return 'gasless_transaction';
    }
    if (lowerMessage.includes('nebula') && (lowerMessage.includes('deploy') || lowerMessage.includes('contract'))) {
      return 'nebula_deploy';
    }
    
    // Standard blockchain intents
    if (lowerMessage.includes('deploy') || lowerMessage.includes('contract')) {
      return 'deploy_contract';
    }
    if (lowerMessage.includes('send') || lowerMessage.includes('transfer')) {
      return 'transfer_tokens';
    }
    if (lowerMessage.includes('check') || lowerMessage.includes('status') || lowerMessage.includes('balance')) {
      return 'check_status';
    }
    if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      return 'task_management';
    }
    
    return 'conversation';
  }

  private shouldCreateTask(intent: string): boolean {
    // These intents require blockchain operations via Goat MCP or Nebula MCP
    const blockchainIntents = [
      'deploy_contract',
      'mint_nft', 
      'transfer_tokens',
      'check_status',
      'bridge_tokens',
      'stake_tokens',
      'list_marketplace',
      'gasless_transaction',
      'nebula_deploy'
    ];
    
    return blockchainIntents.includes(intent);
  }

  private async createBlockchainTask(userId: string, intent: string, message: string, context: ConversationContext): Promise<string> {
    const taskId = uuidv4();
    
    // Create task assignment message
    const taskMessage: AgentMessage = {
      type: 'task_assignment',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'orchestrator',
      payload: {
        taskId,
        userId,
        category: this.mapIntentToCategory(intent),
        parameters: this.extractTaskParameters(message, intent),
        priority: this.determinePriority(intent),
        originalMessage: message,
        conversationContext: context
      }
    };

    // Send task for orchestration
    await this.sendMessage(taskMessage);
    
    this.logActivity('Created blockchain task', { 
      taskId, 
      userId, 
      intent, 
      category: this.mapIntentToCategory(intent) 
    });
    
    return taskId;
  }

  private mapIntentToCategory(intent: string): string {
    const categoryMap: Record<string, string> = {
      'deploy_contract': 'contract_deployment',
      'mint_nft': 'nft_mint', 
      'transfer_tokens': 'token_transfer',
      'check_status': 'account_query',
      'bridge_tokens': 'cross_chain',
      'stake_tokens': 'defi_operations',
      'list_marketplace': 'marketplace_list',
      'gasless_transaction': 'gasless_tx',
      'nebula_deploy': 'token_deploy'
    };
    
    return categoryMap[intent] || 'general';
  }

  private extractTaskParameters(message: string, intent: string): Record<string, any> {
    const lowerMessage = message.toLowerCase();
    const params: Record<string, any> = {};
    
    switch (intent) {
      case 'check_status':
        // Extract what to check
        if (lowerMessage.includes('balance')) {
          params.queryType = 'balance';
          
          // Extract token type
          if (lowerMessage.includes('camp')) params.tokenType = 'CAMP';
          else if (lowerMessage.includes('eth')) params.tokenType = 'ETH';
          else if (lowerMessage.includes('usdc')) params.tokenType = 'USDC';
          else params.tokenType = 'native'; // Default to native token (CAMP)
        } else if (lowerMessage.includes('portfolio')) {
          params.queryType = 'portfolio';
        } else {
          params.queryType = 'general_status';
        }
        break;
        
      case 'transfer_tokens':
        // Extract amount and recipient
        const amountMatch = lowerMessage.match(/(\d+(?:\.\d+)?)/);
        if (amountMatch) params.amount = amountMatch[1];
        
        const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
        if (addressMatch) params.recipient = addressMatch[0];
        break;
        
      case 'deploy_contract':
        // Extract contract details
        if (lowerMessage.includes('erc20')) params.contractType = 'ERC20';
        else if (lowerMessage.includes('erc721')) params.contractType = 'ERC721';
        else params.contractType = 'custom';
        break;
        
      case 'mint_nft':
        // Extract minting details
        const quantityMatch = lowerMessage.match(/(\d+)\s*nft/);
        if (quantityMatch) params.quantity = parseInt(quantityMatch[1]);
        else params.quantity = 1;
        break;
    }
    
    return params;
  }

  private determinePriority(intent: string): 'low' | 'medium' | 'high' {
    const highPriority = ['transfer_tokens', 'deploy_contract', 'nebula_deploy'];
    const mediumPriority = ['mint_nft', 'check_status', 'list_marketplace', 'gasless_transaction'];
    
    if (highPriority.includes(intent)) return 'high';
    if (mediumPriority.includes(intent)) return 'medium';
    return 'low';
  }

  private async generateResponse(message: string, context: ConversationContext, intent: string, taskId?: string | null): Promise<string> {
    const personality = context.companionPersonality;
    
    // Generate personality-based responses
    switch (intent) {
      case 'deploy_contract':
        return taskId 
          ? "I'll help you deploy a smart contract! Creating task now..."
          : this.getPersonalityResponse(personality, 'deploy', "I'll help you deploy a smart contract! Let me analyze your requirements and set everything up.");
        
      case 'mint_nft':
        return taskId 
          ? "Let's mint some NFTs! Setting up the minting process..."
          : this.getPersonalityResponse(personality, 'mint', "Let's mint some NFTs! I can handle the entire process for you.");
        
      case 'transfer_tokens':
        return taskId 
          ? "I'll help you transfer tokens safely. Preparing the transaction..."
          : this.getPersonalityResponse(personality, 'transfer', "I'll help you transfer tokens safely and efficiently.");
        
      case 'check_status':
        return taskId 
          ? "Let me check your CAMP token balance and account status..."
          : await this.generateStatusResponse(context);

      case 'list_marketplace':
        return taskId 
          ? "I'll list your NFT on the marketplace with advanced optimization features..."
          : this.getPersonalityResponse(personality, 'marketplace', "I can list your NFT on the marketplace with optimal pricing.");

      case 'gasless_transaction':
        return taskId 
          ? "Setting up a gasless transaction with sponsored fees..."
          : this.getPersonalityResponse(personality, 'gasless', "I'll handle that transaction with gas sponsorship - no fees for you!");

      case 'nebula_deploy':
        return taskId 
          ? "Deploying your contract using advanced SDK tooling..."
          : this.getPersonalityResponse(personality, 'nebula', "I'll deploy that contract with optimized infrastructure.");
        
      case 'task_management':
        return taskId 
          ? "Creating a new task for your automation workflow..."
          : this.getPersonalityResponse(personality, 'task', "Let me help you manage your tasks and automation workflows.");
        
      default:
        return this.getPersonalityResponse(personality, 'conversation',
          "How can I assist you with your Web3 tasks today?");
    }
  }

  private getPersonalityResponse(personality: string, action: string, defaultResponse: string): string {
    const responses: Record<string, Record<string, string[]>> = {
      helpful: {
        deploy: ["I'll help you deploy that contract right away!", "Let me get that deployment started for you."],
        mint: ["I can mint those NFTs for you!", "Let's get those NFTs created."],
        transfer: ["I'll handle that transfer securely.", "Let me process that transfer for you."],
        marketplace: ["I'll list your NFT on the marketplace!", "Let me get that listed for you."],
        gasless: ["I'll handle that gasless transaction!", "No fees - let me take care of it."],
        nebula: ["I'll deploy using advanced tooling!", "Let me handle the optimized deployment."],
        conversation: ["How can I help you today?", "What would you like me to do?"]
      },
      casual: {
        deploy: ["Sure thing! Let's deploy that contract.", "Got it - deploying now!"],
        mint: ["No problem! Minting those NFTs now.", "Easy - let me mint those for you."],
        transfer: ["You got it - sending those tokens.", "Sure, transferring now."],
        marketplace: ["No worries! Listing it now.", "Easy - getting that listed."],
        gasless: ["Sweet! Zero fees coming up.", "Nice - gasless transaction it is."],
        nebula: ["Awesome! Advanced deployment mode.", "Cool - optimized setup coming up."],
        conversation: ["Hey! What's up?", "What can I do for you?"]
      },
      professional: {
        deploy: ["I will initiate the contract deployment process.", "Commencing smart contract deployment."],
        mint: ["Processing NFT minting request.", "Initiating NFT creation workflow."],
        transfer: ["Executing token transfer operation.", "Processing transfer request."],
        marketplace: ["Initiating marketplace listing process.", "Processing NFT listing request."],
        gasless: ["Executing sponsored transaction protocol.", "Initiating gasless transaction sequence."],
        nebula: ["Deploying with advanced SDK infrastructure.", "Utilizing optimized deployment protocol."],
        conversation: ["How may I assist you?", "What service can I provide?"]
      }
    };

    const personalityResponses = responses[personality] || responses.helpful;
    const actionResponses = personalityResponses[action] || [defaultResponse];
    
    return actionResponses[Math.floor(Math.random() * actionResponses.length)];
  }

  private async generateStatusResponse(context: ConversationContext): Promise<string> {
    const activeTasks = context.activeTasks;
    
    if (activeTasks.length === 0) {
      return "You don't have any active tasks right now. Everything is up to date! 🎉";
    }

    let response = `Here's what's happening:\n\n**Active Tasks (${activeTasks.length})**:\n`;
    
    // This would be populated with actual task data
    activeTasks.forEach((taskId, index) => {
      response += `• Task ${index + 1}: In progress\n`;
    });

    response += '\nNeed help with anything else?';
    return response;
  }

  private async getActiveTasks(userId: string): Promise<string[]> {
    // This would integrate with TaskTracker
    return [];
  }

  private async notifyTaskCompletion(message: AgentMessage): Promise<void> {
    const { payload } = message;
    const { taskId, userId } = payload;
    
    const notificationMessage: AgentMessage = {
      type: 'task_notification',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'user-experience',
      payload: {
        userId,
        type: 'task_complete',
        message: `Task completed successfully! ${payload.result || ''}`,
        taskId
      }
    };

    await this.sendMessage(notificationMessage);
    this.logActivity('Sent task completion notification', { taskId });
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
        originalMessageId: originalMessage.id
      }
    };
  }
}