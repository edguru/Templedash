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
    
    // Generate contextual response
    const response = await this.generateResponse(payload.message, context, intent);
    
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
        requiresAction: intent !== 'conversation'
      }
    };

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
    
    if (lowerMessage.includes('deploy') || lowerMessage.includes('contract')) {
      return 'deploy_contract';
    }
    if (lowerMessage.includes('mint') || lowerMessage.includes('nft')) {
      return 'mint_nft';
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

  private async generateResponse(message: string, context: ConversationContext, intent: string): Promise<string> {
    const personality = context.companionPersonality;
    
    // Generate personality-based responses
    switch (intent) {
      case 'deploy_contract':
        return this.getPersonalityResponse(personality, 'deploy', 
          "I'll help you deploy a smart contract! Let me analyze your requirements and set everything up.");
        
      case 'mint_nft':
        return this.getPersonalityResponse(personality, 'mint',
          "Let's mint some NFTs! I can handle the entire process for you.");
        
      case 'transfer_tokens':
        return this.getPersonalityResponse(personality, 'transfer',
          "I'll help you transfer tokens safely and efficiently.");
        
      case 'check_status':
        return await this.generateStatusResponse(context);
        
      case 'task_management':
        return this.getPersonalityResponse(personality, 'task',
          "Let me help you manage your tasks and automation workflows.");
        
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
        conversation: ["How can I help you today?", "What would you like me to do?"]
      },
      casual: {
        deploy: ["Sure thing! Let's deploy that contract.", "Got it - deploying now!"],
        mint: ["No problem! Minting those NFTs now.", "Easy - let me mint those for you."],
        transfer: ["You got it - sending those tokens.", "Sure, transferring now."],
        conversation: ["Hey! What's up?", "What can I do for you?"]
      },
      professional: {
        deploy: ["I will initiate the contract deployment process.", "Commencing smart contract deployment."],
        mint: ["Processing NFT minting request.", "Initiating NFT creation workflow."],
        transfer: ["Executing token transfer operation.", "Processing transfer request."],
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
    const { taskId, userId, payload } = message;
    
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