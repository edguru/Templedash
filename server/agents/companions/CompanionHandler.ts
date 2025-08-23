import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { CapabilityRegistry, TaskRequirement } from '../core/CapabilityRegistry';
import { ChainOfThoughtEngine } from '../crewai/ChainOfThoughtEngine';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

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
  private openai: OpenAI;
  
  constructor(messageBroker: MessageBroker) {
    super('companion-handler', messageBroker);
    this.capabilityRegistry = new CapabilityRegistry();
    this.chainOfThought = new ChainOfThoughtEngine();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

  // AI-powered intelligent task detection with natural language understanding
  private async analyzeMessageWithChainOfThought(message: string, userId: string): Promise<{
    isTask: boolean;
    confidence: number;
    detectedTaskType: string;
    reasoning: string[];
  }> {
    try {
      // Use AI to intelligently analyze the message instead of rigid patterns
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an intelligent intent detection agent for a Web3 AI companion system. Your role is to analyze user messages and determine if they represent a task request or casual conversation.

TASK CATEGORIES:
- balance_check: Checking wallet balance, token amounts, portfolio status, any financial inquiry
- nft_mint: Creating, minting, or generating NFTs, tokens, or digital assets
- token_transfer: Sending, transferring, or moving tokens/crypto between addresses
- contract_deployment: Deploying smart contracts or creating new blockchain contracts
- defi_operations: Swapping, staking, bridging, or other DeFi activities
- general_blockchain: Any other blockchain-related request or Web3 operation
- conversation: Casual chat, questions, greetings, or non-task interactions

ANALYSIS GUIDELINES:
- Understand user intent from natural language, not just keywords
- Handle variations like "whats my camp balance", "check my tokens", "how much do i have"
- Consider context and conversational flow
- Be flexible with informal language and typos
- High confidence (0.8+) for clear, specific task requests
- Medium confidence (0.5-0.7) for likely task requests with some ambiguity
- Low confidence (0.3-0.5) for unclear but possibly task-related messages
- Very low confidence (0.0-0.3) for casual conversation

RESPONSE FORMAT:
Respond with JSON in this exact format:
{
  "isTask": boolean,
  "confidence": number (0.0-1.0),
  "taskType": "category_name", 
  "reasoning": ["step1", "step2", "step3"],
  "extractedParams": {
    "amount": "value if found",
    "token": "token name if found",
    "address": "wallet address if found"
  }
}`
          },
          {
            role: "user",
            content: `Analyze this user message: "${message}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1 // Very low temperature for consistent analysis
      });

      const result = JSON.parse(completion.choices[0].message.content!);
      
      // Add context-based confidence boost
      const context = this.conversationContext.get(userId);
      let finalConfidence = result.confidence;
      
      if (context && result.isTask) {
        const recentTaskCount = context.taskHistory.slice(-5).length;
        if (recentTaskCount > 0) {
          finalConfidence = Math.min(1.0, finalConfidence * 1.1);
          result.reasoning.push(`User has ${recentTaskCount} recent tasks, boosting confidence`);
        }
      }
      
      this.logActivity('AI intent analysis completed', {
        message: message.substring(0, 50),
        isTask: result.isTask,
        confidence: finalConfidence,
        taskType: result.taskType
      });
      
      return {
        isTask: result.isTask,
        confidence: finalConfidence,
        detectedTaskType: result.taskType,
        reasoning: result.reasoning || [`AI detected: ${result.isTask ? 'Task' : 'Conversation'}`]
      };
    } catch (error) {
      console.error('[CompanionHandler] Error in AI intent analysis:', error);
      
      // Fallback to simple keyword detection if AI fails
      const reasoning = ['AI analysis failed, using fallback detection'];
      const lowerMessage = message.toLowerCase();
      
      // Simple but comprehensive keyword detection
      const taskKeywords = [
        'balance', 'check', 'send', 'transfer', 'mint', 'deploy', 'swap', 
        'stake', 'nft', 'token', 'camp', 'crypto', 'wallet', 'how much',
        'whats', 'what is', 'show me', 'tell me'
      ];
      
      const hasTaskKeyword = taskKeywords.some(keyword => lowerMessage.includes(keyword));
      const isQuestionAboutBalance = /\b(what|whats|how much|check|show|tell)\b.*\b(balance|tokens?|camp|crypto|funds)\b/i.test(message);
      
      const isTask = hasTaskKeyword || isQuestionAboutBalance;
      const confidence = isTask ? 0.6 : 0.1;
      
      let taskType = 'conversation';
      if (isQuestionAboutBalance || lowerMessage.includes('balance') || lowerMessage.includes('camp')) {
        taskType = 'balance_check';
      } else if (lowerMessage.includes('mint')) {
        taskType = 'nft_mint';
      } else if (lowerMessage.includes('send') || lowerMessage.includes('transfer')) {
        taskType = 'token_transfer';
      } else if (isTask) {
        taskType = 'general_blockchain';
      }
      
      reasoning.push(`Fallback analysis: ${isTask ? 'Task' : 'Conversation'} detected`);
      if (isTask) reasoning.push(`Task type inferred: ${taskType}`);
      
      return {
        isTask,
        confidence,
        detectedTaskType: taskType,
        reasoning
      };
    }
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