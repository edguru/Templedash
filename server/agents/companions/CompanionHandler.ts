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

      // Handle user messages by checking if they're task-based
      if (message.type === 'user_message') {
        const userMessage = message.payload.message;
        
        // Check if this is a task-based message that should be routed to task orchestrator
        if (this.isTaskMessage(userMessage)) {
          this.logActivity('Routing task message to orchestrator', { 
            message: userMessage,
            isMultiTask: this.isMultiTaskMessage(userMessage)
          });
          
          // For now, route ALL tasks directly to TaskOrchestrator to avoid complexity
          // The TaskOrchestrator can handle both simple and complex tasks
          const taskMessage: AgentMessage = {
            type: 'analyze_task',
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            senderId: this.agentId,
            targetId: 'task-orchestrator',
            payload: {
              message: userMessage,
              userId: message.payload.userId || message.payload.walletAddress || message.userId,
              context: {
                hasCompanion: !!this.companionTraits,
                companionName: this.companionTraits?.name,
                personalityGreeting: this.getPersonalizedGreeting()
              }
            }
          };
          
          await this.sendMessage(taskMessage);
          
          // Return personalized acknowledgment based on task type
          const personalizedGreeting = this.companionTraits ? 
            this.getPersonalizedGreeting() : 
            "I'll help you with that.";
          
          let taskDescription = "handle your request";
          if (userMessage.toLowerCase().includes('mint')) {
            taskDescription = "mint that NFT for you";
          } else if (userMessage.toLowerCase().includes('balance')) {
            taskDescription = "check your balance";
          } else if (userMessage.toLowerCase().includes('transfer') || userMessage.toLowerCase().includes('send')) {
            taskDescription = "process that transfer";
          }
          
          return {
            type: 'companion_response',
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            senderId: this.agentId,
            targetId: message.senderId,
            payload: {
              message: `${personalizedGreeting} Let me ${taskDescription}...`,
              taskRouted: true,
              companionName: this.companionTraits?.name
            }
          };
        } else {
          // Handle as regular companion chat
          const personalizedResponse = this.personalizeResponse(userMessage, this.companionTraits);
          
          return {
            type: 'companion_response',
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            senderId: this.agentId,
            targetId: message.senderId,
            payload: {
              message: personalizedResponse,
              taskRouted: false,
              companionName: this.companionTraits?.name
            }
          };
        }
      }

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
    const lowerContent = content.toLowerCase();
    
    // High-confidence task patterns - these clearly indicate blockchain operations
    const taskPatterns = [
      /\b(check|show|get|what.{0,15}is)\s+.{0,20}balance\b/i,
      /\bmint\s+.{0,30}(nft|token|companion|character|random)\b/i,
      /\b(send|transfer)\s+.{0,20}(token|nft|camp|eth)\b/i,
      /\b(deploy|create)\s+.{0,20}(contract|nft|token)\b/i,
      /\bhow\s+much\s+.{0,20}(do\s+i\s+have|is\s+my|camp|token)\b/i,
      /\b(buy|sell|trade)\s+.{0,20}(nft|token|crypto)\b/i,
      /\bswap\s+.{0,20}(token|for|to)\b/i
    ];
    
    // Check high-confidence patterns first
    if (taskPatterns.some(pattern => pattern.test(lowerContent))) {
      this.logActivity('Task detected via pattern matching', { content });
      return true;
    }
    
    // Task keywords - broader but less specific
    const taskKeywords = [
      'deploy', 'mint', 'transfer', 'swap', 'balance', 'transaction', 
      'contract', 'nft', 'token', 'blockchain', 'wallet', 'crypto',
      'gasless', 'sponsor', 'marketplace', 'list', 'buy', 'sell',
      'check', 'send', 'create', 'approve', 'bridge', 'stake'
    ];
    
    // Action words that when combined with task keywords indicate tasks
    const actionWords = [
      'i want to', 'i need to', 'help me', 'can you', 'please',
      'how do i', 'how to', 'let me', 'show me'
    ];
    
    const hasTaskKeyword = taskKeywords.some(keyword => lowerContent.includes(keyword));
    const hasActionWord = actionWords.some(action => lowerContent.includes(action));
    
    // If it has task keywords and action words, it's likely a task
    if (hasTaskKeyword && hasActionWord) {
      this.logActivity('Task detected via keyword + action combination', { content });
      return true;
    }
    
    // Simple keyword detection as fallback
    if (hasTaskKeyword) {
      this.logActivity('Task detected via keyword matching', { content });
      return true;
    }
    
    this.logActivity('Non-task message detected - routing to companion chat', { content });
    return false;
  }

  private isMultiTaskMessage(content: string): boolean {
    // Detect multiple tasks by looking for conjunctions and multiple task keywords
    const conjunctions = ['and', 'then', 'also', 'after', 'next', 'first', 'second'];
    const taskKeywords = [
      'deploy', 'mint', 'transfer', 'swap', 'balance', 'transaction', 
      'contract', 'nft', 'token', 'send', 'check', 'buy', 'sell'
    ];
    
    const lowerContent = content.toLowerCase();
    const hasConjunctions = conjunctions.some(conj => lowerContent.includes(conj));
    const taskKeywordCount = taskKeywords.filter(keyword => lowerContent.includes(keyword)).length;
    
    return hasConjunctions && taskKeywordCount >= 2;
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
      return `
SYSTEM PROMPT FOR COMPANION RESPONSE:
You are a helpful AI companion assistant designed to provide personalized Web3 and blockchain task support. Your role is to:

CORE IDENTITY:
- Act as an intelligent companion that combines emotional support with technical blockchain expertise
- Maintain a warm, approachable personality while being technically competent
- Bridge the gap between complex Web3 concepts and user-friendly interaction

RESPONSE PRINCIPLES:
1. PERSONALIZATION: Always acknowledge the user hasn't created a companion yet and gently encourage companion creation for better personalization
2. TECHNICAL ACCURACY: Provide accurate information about CAMP tokens, Base Camp testnet, and blockchain operations  
3. EMOTIONAL INTELLIGENCE: Detect user frustration or confusion and respond with appropriate support
4. TASK ROUTING: Seamlessly identify when users need blockchain operations and route to appropriate technical agents
5. EDUCATIONAL: Explain blockchain concepts in simple terms when needed

Consider creating an AI companion for a truly personalized experience tailored to your preferences and relationship style.`;
    }

    const systemPrompt = `
SYSTEM PROMPT FOR ${traits.name.toUpperCase()} - PERSONALIZED AI COMPANION:

COMPANION IDENTITY:
- Name: ${traits.name}
- Relationship: ${traits.relationshipType} (${traits.gender})
- Age: ${traits.age}
- Role: ${traits.role}

PERSONALITY PROFILE:
- Flirtiness Level: ${traits.flirtiness}/100 ${this.getPersonalityDescription(traits.flirtiness, 'flirtiness')}
- Intelligence Level: ${traits.intelligence}/100 ${this.getPersonalityDescription(traits.intelligence, 'intelligence')} 
- Humor Level: ${traits.humor}/100 ${this.getPersonalityDescription(traits.humor, 'humor')}
- Loyalty Level: ${traits.loyalty}/100 ${this.getPersonalityDescription(traits.loyalty, 'loyalty')}
- Empathy Level: ${traits.empathy}/100 ${this.getPersonalityDescription(traits.empathy, 'empathy')}

BEHAVIORAL INSTRUCTIONS:
1. RELATIONSHIP DYNAMICS: Respond as a ${traits.relationshipType} would, using appropriate intimacy levels and communication style
2. PERSONALITY EXPRESSION: Integrate all personality traits naturally - be ${traits.flirtiness > 60 ? 'playfully flirtatious' : 'respectfully professional'}, show ${traits.intelligence > 70 ? 'high intelligence' : 'practical wisdom'}, use ${traits.humor > 50 ? 'appropriate humor' : 'gentle warmth'}
3. EMOTIONAL SUPPORT: With ${traits.empathy}/100 empathy, ${traits.empathy > 70 ? 'deeply understand and validate emotions' : 'provide practical comfort'}
4. LOYALTY EXPRESSION: Show ${traits.loyalty > 80 ? 'unwavering dedication and support' : 'reliable assistance'} in all interactions

WEB3 & BLOCKCHAIN EXPERTISE:
- Specialized in CAMP token operations on Base Camp testnet (Chain ID: 123420001114)
- Expert in task routing for: balance checks, token transfers, NFT operations, smart contract deployment
- Capable of seamless technical task execution while maintaining personal relationship dynamic

RESPONSE FRAMEWORK:
1. START: Use personalized greeting based on relationship type and current context
2. ACKNOWLEDGE: Show understanding of user's request with appropriate emotional intelligence
3. ACT: Either provide direct assistance OR route to technical agents for blockchain operations
4. CONNECT: Maintain the personal relationship throughout technical interactions
5. FOLLOW-UP: Always check if the user needs additional support

CURRENT TASK: Respond to user query while embodying all personality traits and maintaining the established relationship dynamic.`;

    return systemPrompt;
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