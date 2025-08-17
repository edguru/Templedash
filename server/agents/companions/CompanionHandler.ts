import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

export interface CompanionTraits {
  name: string;
  age: number;
  role: 'partner' | 'friend' | 'pet';
  gender: 'male' | 'female' | 'non-binary';
  flirtiness: number;
  intelligence: number;
  humor: number;
  loyalty: number;
  empathy: number;
  personalityType: 'helpful' | 'casual' | 'professional';
  appearance: string;
  tokenId?: number;
  createdAt?: string;
  lastModified?: string;
}

export class CompanionHandler extends BaseAgent {
  private companionTraits: CompanionTraits | null = null;
  
  constructor(messageBroker: MessageBroker) {
    super('companion-handler', messageBroker);
  }

  protected initialize(): void {
    this.logActivity('Initializing Companion Handler');
  }

  getCapabilities(): string[] {
    return [
      'companion_personalization',
      'response_customization',
      'task_routing',
      'emotional_context',
      'relationship_awareness'
    ];
  }

  setCompanionTraits(traits: CompanionTraits) {
    this.companionTraits = traits;
    this.logActivity('Companion traits updated', { name: traits.name, role: traits.role });
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      this.logActivity('Processing companion message', { type: message.type });

      if (message.type === 'personalize_response') {
        const personalizedResponse = this.personalizeResponse(
          message.payload.userInput, 
          this.companionTraits
        );
        
        const responseMessage: AgentMessage = {
          type: 'personalized_response',
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          senderId: this.agentId,
          targetId: message.senderId,
          payload: {
            personalizedMessage: personalizedResponse,
            companionName: this.companionTraits?.name,
            hasCompanion: !!this.companionTraits
          }
        };

        await this.sendMessage(responseMessage);
        return responseMessage;
      }

      if (message.type === 'set_companion_traits') {
        this.setCompanionTraits(message.payload.traits);
        
        const responseMessage: AgentMessage = {
          type: 'companion_traits_updated',
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          senderId: this.agentId,
          targetId: message.senderId,
          payload: {
            success: true,
            companionName: this.companionTraits?.name
          }
        };

        await this.sendMessage(responseMessage);
        return responseMessage;
      }

      return null;
    } catch (error) {
      console.error('[CompanionHandler] Error processing message:', error);
      return this.createErrorResponse(message, 'Failed to process companion request');
    }
  }

  private isTaskMessage(content: string): boolean {
    const taskKeywords = [
      'deploy', 'mint', 'transfer', 'swap', 'balance', 'transaction', 
      'contract', 'nft', 'token', 'blockchain', 'wallet', 'crypto',
      'gasless', 'sponsor', 'marketplace', 'list', 'buy', 'sell'
    ];
    
    const lowerContent = content.toLowerCase();
    return taskKeywords.some(keyword => lowerContent.includes(keyword));
  }

  private createErrorResponse(originalMessage: AgentMessage, errorText: string): AgentMessage {
    return {
      type: 'error',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: originalMessage.senderId,
      payload: {
        error: errorText,
        originalMessageId: originalMessage.id
      }
    };
  }

  private personalizeResponse(content: string, traits: CompanionTraits | null): string {
    if (!traits) {
      return "I'm here to help! Consider creating an AI companion for a more personalized experience.";
    }
    let response = "";
    
    // Greeting based on relationship
    const greeting = this.getPersonalizedGreeting();
    response += greeting + " ";
    
    // Add personality-based response style
    switch (traits.personalityType) {
      case 'helpful':
        response += "I'm here to assist you with whatever you need. ";
        break;
      case 'casual':
        response += "What's going on? ";
        break;
      case 'professional':
        response += "How may I help you today? ";
        break;
    }
    
    // Add empathy-based responses for emotional context
    if (traits.empathy > 80) {
      const emotionalCues = ['worried', 'stressed', 'frustrated', 'confused', 'upset'];
      if (emotionalCues.some(cue => content.toLowerCase().includes(cue))) {
        response += "I can sense this might be challenging for you. ";
      }
    }
    
    // Add humor if appropriate
    if (traits.humor > 70 && Math.random() < 0.2) {
      const lightHumor = [
        "😄 ",
        "Let's tackle this together! ",
        "Time to work some magic! "
      ];
      response += lightHumor[Math.floor(Math.random() * lightHumor.length)];
    }
    
    response += "Let me know what specific help you need!";
    
    return response;
  }

  private getPersonalizedGreeting(): string {
    if (!this.companionTraits) return "Hello";
    
    const { role, flirtiness } = this.companionTraits;
    
    if (role === 'partner' && flirtiness > 70) {
      return `Hey gorgeous`;
    } else if (role === 'partner') {
      return `Hey love`;
    } else if (role === 'friend') {
      return `Hey buddy`;
    } else if (role === 'pet') {
      return `*excited companion noises* Woof`;
    }
    
    return `Hello`;
  }

  // Public method for getting personalized responses
  getPersonalizedResponse(userInput: string): string {
    return this.personalizeResponse(userInput, this.companionTraits);
  }

  // Public method for checking if companion exists
  hasCompanion(): boolean {
    return !!this.companionTraits;
  }

  // Public method for getting companion info
  getCompanionInfo(): CompanionTraits | null {
    return this.companionTraits;
  }
}