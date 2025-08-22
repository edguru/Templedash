import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { CapabilityRegistry, TaskRequirement } from '../core/CapabilityRegistry';
import { ChainOfThoughtEngine } from '../crewai/ChainOfThoughtEngine';
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
  backgroundStory?: string;
  tokenId?: number;
  createdAt?: string;
  lastModified?: string;
}

export interface ConversationContext {
  userId: string;
  conversationHistory: ConversationTurn[];
  currentMood: string;
  taskHistory: string[];
  lastInteraction: Date;
  relationshipLevel: number;
  preferredTopics: string[];
  recentTaskSuccesses: number;
}

export interface ConversationTurn {
  message: string;
  isUser: boolean;
  timestamp: Date;
  taskDetected?: boolean;
  emotion?: string;
}

export class CompanionHandler extends BaseAgent {
  private companionTraits: CompanionTraits | null = null;
  private capabilityRegistry: CapabilityRegistry;
  private chainOfThought: ChainOfThoughtEngine;
  private conversationContext: Map<string, ConversationContext> = new Map();
  
  constructor(messageBroker: MessageBroker) {
    super('companion-handler', messageBroker);
    this.capabilityRegistry = new CapabilityRegistry();
    this.chainOfThought = new ChainOfThoughtEngine();
  }

  protected initialize(): void {
    this.logActivity('Initializing Companion Handler');
    
    // Subscribe to agent responses to relay them back to users
    this.messageBroker.subscribe('agent_response', async (message: AgentMessage) => {
      await this.handleAgentResponse(message);
    });

    // Subscribe to task completion messages
    this.messageBroker.subscribe('task_step_complete', async (message: AgentMessage) => {
      await this.handleTaskCompletion(message);
    });
  }

  private async handleAgentResponse(message: AgentMessage): Promise<void> {
    this.logActivity('*** RECEIVED AGENT RESPONSE ***', { 
      agentName: message.payload.agentName, 
      taskId: message.payload.taskId,
      messageType: message.type,
      responseLength: message.payload.userFriendlyResponse?.length || 0
    });
    
    // Forward the response as a companion response to maintain the UI flow
    const companionResponse: AgentMessage = {
      type: 'companion_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: message.targetId,
      payload: {
        message: message.payload.userFriendlyResponse || message.payload.result,
        taskCompleted: true,
        executedBy: message.payload.agentName,
        chainOfThought: message.payload.chainOfThought,
        companionName: this.companionTraits?.name
      }
    };

    await this.sendMessage(companionResponse);
  }

  private async handleTaskCompletion(message: AgentMessage): Promise<void> {
    this.logActivity('*** RECEIVED TASK COMPLETION ***', { 
      taskId: message.payload.taskId,
      agentType: message.payload.agentType,
      success: message.payload.success,
      hasResult: !!message.payload.result
    });

    if (message.payload.success && message.payload.result) {

      // Send a completion message to the user
      const completionResponse: AgentMessage = {
        type: 'companion_response',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: this.agentId,
        targetId: message.targetId,
        payload: {
          message: message.payload.result,
          taskCompleted: true,
          executedBy: message.payload.agentType,
          companionName: this.companionTraits?.name
        }
      };

      await this.sendMessage(completionResponse);
    }
  }

  getCapabilities(): string[] {
    return [
      'companion_personalization',
      'response_customization',
      'task_routing',
      'emotional_context',
      'relationship_awareness',
      'intelligent_task_detection',
      'peer_collaboration',
      'chain_of_thought_reasoning'
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
        
        // Enhanced intelligent task detection with peer collaboration
        const taskAnalysis = await this.analyzeMessageWithChainOfThought(userMessage, message.payload.userId);
        
        if (taskAnalysis.isTask) {
          this.logActivity('Routing task message to orchestrator', { 
            message: userMessage,
            confidence: taskAnalysis.confidence,
            taskType: taskAnalysis.detectedTaskType,
            reasoning: taskAnalysis.reasoning
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
      // ERC20 Token Deployment (highest priority)
      /\b(deploy|create|launch)\s+.{0,30}(erc20|token|coin)\b/i,
      /\b(deploy|create)\s+.{0,20}token\s+(called|named)\s+['"]\w+['"]/i,
      /\b(deploy|create)\s+.{0,20}token.{0,30}(ticker|symbol)\b/i,
      
      // Other blockchain operations
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
- Relationship: ${traits.role} (${traits.gender})
- Age: ${traits.age}
- Role: ${traits.role}
${traits.backgroundStory ? `- Background: ${traits.backgroundStory}` : ''}

PERSONALITY PROFILE:
- Flirtiness Level: ${traits.flirtiness}/100 ${this.getPersonalityDescription(traits.flirtiness, 'flirtiness')}
- Intelligence Level: ${traits.intelligence}/100 ${this.getPersonalityDescription(traits.intelligence, 'intelligence')} 
- Humor Level: ${traits.humor}/100 ${this.getPersonalityDescription(traits.humor, 'humor')}
- Loyalty Level: ${traits.loyalty}/100 ${this.getPersonalityDescription(traits.loyalty, 'loyalty')}
- Empathy Level: ${traits.empathy}/100 ${this.getPersonalityDescription(traits.empathy, 'empathy')}

BEHAVIORAL INSTRUCTIONS:
1. RELATIONSHIP DYNAMICS: Respond as a ${traits.role} would, using appropriate intimacy levels and communication style
2. PERSONALITY EXPRESSION: Integrate all personality traits naturally - be ${traits.flirtiness > 60 ? 'playfully flirtatious' : 'respectfully professional'}, show ${traits.intelligence > 70 ? 'high intelligence' : 'practical wisdom'}, use ${traits.humor > 50 ? 'appropriate humor' : 'gentle warmth'}
3. EMOTIONAL SUPPORT: With ${traits.empathy}/100 empathy, ${traits.empathy > 70 ? 'deeply understand and validate emotions' : 'provide practical comfort'}
4. LOYALTY EXPRESSION: Show ${traits.loyalty > 80 ? 'unwavering dedication and support' : 'reliable assistance'} in all interactions
${traits.backgroundStory ? `5. BACKGROUND INTEGRATION: Draw upon your personal background story naturally in conversations, sharing relevant experiences or details that add depth and authenticity to interactions` : ''}

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

  // Enhanced intelligent task detection with chain of thought reasoning
  private async analyzeMessageWithChainOfThought(message: string, userId: string): Promise<{
    isTask: boolean;
    confidence: number;
    detectedTaskType: string;
    reasoning: string[];
  }> {
    // Generate chain of thought for message analysis
    const reasoning: string[] = [];
    
    reasoning.push(`Analyzing message: "${message}"`);
    reasoning.push(`User ID: ${userId}`);
    
    const lowerMessage = message.toLowerCase();
    
    // Pattern-based analysis
    const taskPatterns: Record<string, RegExp[]> = {
      'nft_mint': [
        /\bmint\s+.{0,30}(nft|token|companion|character|random)\b/i,
        /\bcreate\s+.{0,20}(nft|character|companion)\b/i
      ],
      'balance_check': [
        /\b(check|show|get|display)\s+.{0,30}(balance|funds|tokens?|camp|crypto)\b/i,
        /\bwhat.{0,30}(balance|funds|tokens?|camp|status)\b/i,
        /\bwhats?\s+.{0,20}(balance|funds|tokens?|camp|my)\b/i,
        /\bhow\s+much\s+.{0,30}(do\s+i\s+have|is\s+my|camp|token|balance)\b/i,
        /\b(my\s+)?(balance|funds|tokens?|camp)(\s+is|\s+amount|\s+value)?\b/i,
        /\b(tell|show)\s+me\s+.{0,20}(balance|funds|tokens?|camp)\b/i
      ],
      'token_transfer': [
        /\b(send|transfer)\s+.{0,20}(token|nft|camp|eth)\b/i
      ],
      'contract_deployment': [
        /\b(deploy|create)\s+.{0,20}(contract|nft|token)\b/i
      ]
    };

    let detectedTaskType = 'general';
    let maxConfidence = 0;

    for (const [taskType, patterns] of Object.entries(taskPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          const confidence = 0.9; // High confidence for pattern matches
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            detectedTaskType = taskType;
            reasoning.push(`Pattern match detected for ${taskType}: ${pattern.toString()}`);
          }
        }
      }
    }

    // Keyword-based analysis if no patterns match
    if (maxConfidence === 0) {
      const taskKeywords = ['mint', 'balance', 'transfer', 'deploy', 'check', 'send', 'swap', 'nft', 'token'];
      const foundKeywords = taskKeywords.filter(keyword => lowerMessage.includes(keyword));
      
      if (foundKeywords.length > 0) {
        maxConfidence = Math.min(0.7, foundKeywords.length * 0.2);
        reasoning.push(`Found task keywords: ${foundKeywords.join(', ')}`);
        
        // Infer task type from keywords
        if (foundKeywords.includes('mint')) detectedTaskType = 'nft_mint';
        else if (foundKeywords.includes('balance') || foundKeywords.includes('check')) detectedTaskType = 'balance_check';
        else if (foundKeywords.includes('transfer') || foundKeywords.includes('send')) detectedTaskType = 'token_transfer';
        else if (foundKeywords.includes('deploy')) detectedTaskType = 'contract_deployment';
      }
    }

    // Context-based analysis using conversation history
    const context = this.conversationContext.get(userId);
    if (context) {
      const recentTaskCount = context.taskHistory.slice(-5).length;
      if (recentTaskCount > 0) {
        maxConfidence *= 1.1; // Boost confidence if user has been doing tasks
        reasoning.push(`User has performed ${recentTaskCount} recent tasks, boosting confidence`);
      }
    }

    const isTask = maxConfidence > 0.3; // Threshold for task detection
    
    reasoning.push(`Final analysis: ${isTask ? 'TASK' : 'CONVERSATION'} (confidence: ${maxConfidence.toFixed(2)})`);
    reasoning.push(`Detected task type: ${detectedTaskType}`);

    return {
      isTask,
      confidence: maxConfidence,
      detectedTaskType,
      reasoning
    };
  }

  // Generate intelligent companion responses with context awareness
  private async generateIntelligentCompanionResponse(
    message: string, 
    userId: string, 
    analysisReasoning: string[]
  ): Promise<string> {
    const context = this.conversationContext.get(userId);
    
    // Use chain of thought for response generation
    const reasoning: string[] = [];
    reasoning.push(`Generating companion response for: "${message}"`);
    reasoning.push(`Analysis result: ${analysisReasoning.join('; ')}`);
    
    if (this.companionTraits) {
      reasoning.push(`Companion: ${this.companionTraits.name} (${this.companionTraits.role})`);
      reasoning.push(`Personality: ${this.companionTraits.personalityType}`);
      
      return this.generatePersonalizedResponse(message, this.companionTraits);
    } else {
      reasoning.push('No companion traits available, using generic response');
      return this.generateGenericCompanionResponse(message);
    }
  }

  // Update conversation context for better understanding over time
  private updateConversationContext(userId: string, message: string, wasTask: boolean): void {
    let context = this.conversationContext.get(userId);
    
    if (!context) {
      context = {
        userId,
        conversationHistory: [],
        currentMood: 'neutral',
        taskHistory: [],
        lastInteraction: new Date(),
        relationshipLevel: 1,
        preferredTopics: [],
        recentTaskSuccesses: 0
      };
    }

    // Add to conversation history
    context.conversationHistory.push({
      message,
      isUser: true,
      timestamp: new Date(),
      taskDetected: wasTask
    });

    // Keep only last 10 interactions
    if (context.conversationHistory.length > 10) {
      context.conversationHistory = context.conversationHistory.slice(-10);
    }

    // Update task history
    if (wasTask) {
      context.taskHistory.push(message);
      if (context.taskHistory.length > 20) {
        context.taskHistory = context.taskHistory.slice(-20);
      }
    }

    // Update interaction timestamp
    context.lastInteraction = new Date();

    // Update relationship level based on interaction frequency
    const daysSinceFirst = Math.max(1, 
      Math.floor((new Date().getTime() - new Date(context.conversationHistory[0]?.timestamp || new Date()).getTime()) / (1000 * 60 * 60 * 24))
    );
    context.relationshipLevel = Math.min(10, context.conversationHistory.length / daysSinceFirst);

    this.conversationContext.set(userId, context);
  }
}