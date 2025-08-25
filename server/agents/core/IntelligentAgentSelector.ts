// AI-Powered Intelligent Agent Selector - Natural language understanding for agent selection
import OpenAI from 'openai';
import { AgentConfigManager } from '../../config/AgentConfigManager';
import { AgentConfig } from '../../config/AgentConfigManager';
import { RAGAgentSelector, RAGSelectionRequest, RAGSelectionResult } from './RAGAgentSelector';
import { AgentClassificationSystem, AgentCategory } from './AgentClassificationSystem';
import { BlockchainTaskRouter, BlockchainTaskAnalysis } from './BlockchainTaskRouter';

export interface AgentSelectionRequest {
  taskDescription: string;
  taskType?: string;
  priority: 'low' | 'medium' | 'high';
  context?: Record<string, any>;
  userId?: string;
}

export interface AgentMatch {
  agentId: string;
  agentName: string;
  confidence: number;
  reasoning: string[];
  agentType: string;
  capabilities: string[];
  estimatedSuccess: number;
}

export interface AgentSelectionResult {
  primaryAgent: AgentMatch;
  alternativeAgents: AgentMatch[];
  taskAnalysis: {
    category: string;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedDuration: string;
    requiredCapabilities: string[];
  };
  reasoning: string[];
}

export class IntelligentAgentSelector {
  private openai: OpenAI;
  private configManager: AgentConfigManager;
  private agentConfigs: Record<string, AgentConfig> = {};
  private ragSelector: RAGAgentSelector;
  private classificationSystem: AgentClassificationSystem;

  constructor() {
    // Force fresh OpenAI client initialization (clean any whitespace)  
    const apiKey = process.env.OPENAI_API_KEY?.replace(/\s+/g, '') || '';
    this.openai = new OpenAI({ apiKey });
    this.configManager = new AgentConfigManager();
    this.classificationSystem = new AgentClassificationSystem();
    this.ragSelector = new RAGAgentSelector();
    this.loadAgentConfigurations();
    console.log('[IntelligentAgentSelector] OpenAI client initialized with RAG for TASK agents only', {
      keyPrefix: apiKey.substring(0, 15),
      keyLength: apiKey.length,
      hasKey: !!apiKey
    });
  }

  /**
   * Load all agent configurations for intelligent matching
   */
  private loadAgentConfigurations(): void {
    try {
      this.agentConfigs = this.configManager.getAllAgents();
      console.log(`[IntelligentAgentSelector] Loaded ${Object.keys(this.agentConfigs).length} agent configurations`);
    } catch (error) {
      console.error('[IntelligentAgentSelector] Failed to load agent configurations:', error);
    }
  }

  /**
   * Select the best agent(s) for a task using hybrid RAG + traditional routing
   */
  async selectBestAgent(request: AgentSelectionRequest): Promise<AgentSelectionResult> {
    try {
      // Check if this should be routed to task agents (use RAG) or non-task agents (traditional)
      const isTaskAgent = this.shouldUseTaskAgentRouting(request.taskDescription);
      
      if (isTaskAgent) {
        console.log('[IntelligentAgentSelector] Routing to TASK agents using RAG selection');
        return await this.selectWithRAG(request);
      }

      // Use traditional AI analysis for non-task agents (orchestrator, companion, etc)
      console.log('[IntelligentAgentSelector] Routing to NON-TASK agents using traditional AI');
      const agentProfiles = this.buildNonTaskAgentProfiles();
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an intelligent agent selection system for a multi-agent AI platform. Your role is to analyze tasks and select the most appropriate agents based on their descriptions, capabilities, and specializations.

AGENT PROFILES:
${agentProfiles}

SELECTION CRITERIA:
- Match task requirements to agent capabilities and specializations
- Consider agent descriptions, roles, and keywords
- Analyze task complexity and required expertise
- Factor in agent performance metrics (success rate, load, latency)
- Prioritize agents with direct capability matches
- Consider context and user intent

TASK ANALYSIS:
- Categorize the task (blockchain, research, code, conversation, etc.)
- Assess complexity level (simple, moderate, complex)
- Identify required capabilities
- Estimate task duration

RESPONSE FORMAT:
Respond with JSON in this exact format:
{
  "primaryAgent": {
    "agentId": "agent-id",
    "agentName": "AgentName", 
    "confidence": number (0.0-1.0),
    "reasoning": ["reason1", "reason2", "reason3"],
    "agentType": "type",
    "capabilities": ["cap1", "cap2"],
    "estimatedSuccess": number (0.0-1.0)
  },
  "alternativeAgents": [
    {
      "agentId": "alternative-agent-id",
      "agentName": "AlternativeAgent",
      "confidence": number (0.0-1.0), 
      "reasoning": ["reason1", "reason2"],
      "agentType": "type",
      "capabilities": ["cap1", "cap2"],
      "estimatedSuccess": number (0.0-1.0)
    }
  ],
  "taskAnalysis": {
    "category": "category_name",
    "complexity": "simple|moderate|complex",
    "estimatedDuration": "duration_estimate",
    "requiredCapabilities": ["required_cap1", "required_cap2"]
  },
  "reasoning": ["overall_reason1", "overall_reason2", "overall_reason3"]
}`
          },
          {
            role: "user",
            content: `Task: "${request.taskDescription}"
Priority: ${request.priority}
Context: ${JSON.stringify(request.context || {})}

Select the best agent(s) for this task and provide detailed analysis.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2 // Low temperature for consistent agent selection
      });

      const result = JSON.parse(completion.choices[0].message.content!);
      
      // Validate and enhance the result
      return this.validateAndEnhanceResult(result, request);
      
    } catch (error) {
      console.error('[IntelligentAgentSelector] Error in AI agent selection:', error);
      return this.createErrorResponse(request);
    }
  }

  /**
   * Build comprehensive agent profiles for AI analysis
   */
  private buildAgentProfiles(): string {
    const profiles: string[] = [];
    
    for (const [agentId, config] of Object.entries(this.agentConfigs)) {
      const profile = `
AGENT: ${config.name} (${agentId})
Type: ${config.type}
Role: ${config.role}
Description: ${config.systemMessage}
Capabilities: ${config.capabilities?.join(', ') || 'Not specified'}
Keywords: ${config.keywords?.join(', ') || 'Not specified'}
Performance: Success Rate ${config.successRate}, Load Factor ${config.loadFactor}, Latency ${config.averageLatency}ms
Priority: ${config.priority}
      `.trim();
      
      profiles.push(profile);
    }
    
    return profiles.join('\n\n');
  }

  /**
   * Validate and enhance AI selection results
   */
  private validateAndEnhanceResult(result: any, request: AgentSelectionRequest): AgentSelectionResult {
    // Ensure primary agent exists in our configs
    if (!this.agentConfigs[result.primaryAgent?.agentId]) {
      console.error(`[IntelligentAgentSelector] Primary agent ${result.primaryAgent?.agentId} not found in configs`);
      return this.createErrorResponse(request);
    }

    // Filter alternative agents to only include valid ones
    const validAlternatives = (result.alternativeAgents || []).filter((agent: any) => 
      this.agentConfigs[agent.agentId]
    );

    return {
      primaryAgent: result.primaryAgent,
      alternativeAgents: validAlternatives,
      taskAnalysis: result.taskAnalysis || {
        category: 'general',
        complexity: 'moderate',
        estimatedDuration: '2-5 minutes',
        requiredCapabilities: []
      },
      reasoning: result.reasoning || ['AI-powered agent selection based on task analysis']
    };
  }

  /**
   * Error response when AI analysis is not available - NO HARDCODED FALLBACKS
   */
  private createErrorResponse(request: AgentSelectionRequest): AgentSelectionResult {
    throw new Error(`AI agent selection failed: OpenAI API key required for intelligent task routing. Task: "${request.taskDescription}"`);
  }

  /**
   * Get agent configuration by ID
   */
  getAgentConfig(agentId: string): AgentConfig | null {
    return this.agentConfigs[agentId] || null;
  }

  /**
   * Get all available agents
   */
  getAllAgents(): Record<string, AgentConfig> {
    return this.agentConfigs;
  }

  /**
   * Use RAG system for execution-focused agent selection with blockchain-specific routing
   */
  private async selectWithRAG(request: AgentSelectionRequest): Promise<AgentSelectionResult> {
    try {
      // Natural AI-powered agent selection (no forced routing)

      // First, analyze if this is a blockchain task and get routing suggestions
      const blockchainAnalysis = BlockchainTaskRouter.analyzeBlockchainTask(request.taskDescription);
      
      console.log('[IntelligentAgentSelector] Blockchain task analysis:', {
        taskType: blockchainAnalysis.taskType,
        suggestedAgent: blockchainAnalysis.suggestedAgent,
        confidence: blockchainAnalysis.confidence,
        networks: blockchainAnalysis.networks,
        reasoning: blockchainAnalysis.reasoning
      });
      
      // For high-confidence blockchain routing, prioritize the suggested agent
      if (blockchainAnalysis.confidence > 0.7) {
        console.log(`[IntelligentAgentSelector] High-confidence blockchain routing to ${blockchainAnalysis.suggestedAgent}`);
      }
      
      const ragRequest: RAGSelectionRequest = {
        taskDescription: request.taskDescription,
        taskType: request.taskType,
        priority: request.priority,
        context: {
          ...request.context,
          blockchainAnalysis,
          targetNetworks: blockchainAnalysis.networks,
          isPureAISelection: true,
          walletAddress: request.userId // Pass wallet address explicitly
        },
        userId: request.userId,
        requireExecution: true
      };
      
      console.log('[IntelligentAgentSelector] Pure AI selection request:', {
        isPureAI: true,
        blockchainContext: blockchainAnalysis.confidence > 0.5,
        networks: blockchainAnalysis.networks,
        message: 'Using pure AI intelligence for agent selection'
      });

      const ragResult = await this.ragSelector.selectBestAgent(ragRequest);
      
      // Add blockchain context to reasoning if relevant
      if (blockchainAnalysis.confidence > 0.5) {
        ragResult.semanticReasoning.unshift(`Blockchain context: ${blockchainAnalysis.reasoning.join(', ')}`);
        ragResult.semanticReasoning.push('Pure AI selection based on agent capabilities and task requirements');
      }

      return this.buildRAGResult(ragResult, blockchainAnalysis);
      
    } catch (error) {
      console.error('[IntelligentAgentSelector] RAG selection failed:', error);
      throw new Error(`RAG agent selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Build standardized RAG result with blockchain analysis integration
   */
  private buildRAGResult(ragResult: RAGSelectionResult, blockchainAnalysis: BlockchainTaskAnalysis): AgentSelectionResult {
    const reasoning = [
      ...ragResult.semanticReasoning,
      `RAG Selection: ${ragResult.primaryAgent.agentName} selected with ${(ragResult.primaryAgent.semanticSimilarity * 100).toFixed(1)}% semantic similarity`,
      `Execution capable: ${ragResult.primaryAgent.executionCapable ? 'Yes' : 'No'}`
    ];
    
    // Add blockchain-specific reasoning if applicable
    if (blockchainAnalysis.confidence > 0.3) {
      reasoning.push(`Blockchain Analysis: ${blockchainAnalysis.taskType} task with ${(blockchainAnalysis.confidence * 100).toFixed(1)}% confidence`);
      if (blockchainAnalysis.networks.length > 0) {
        reasoning.push(`Target Networks: ${blockchainAnalysis.networks.join(', ')}`);
      }
    }

    return {
      primaryAgent: {
        agentId: ragResult.primaryAgent.agentId,
        agentName: ragResult.primaryAgent.agentName,
        confidence: ragResult.primaryAgent.confidence,
        reasoning: ragResult.primaryAgent.reasoning,
        agentType: ragResult.primaryAgent.agentType,
        capabilities: ragResult.primaryAgent.capabilities,
        estimatedSuccess: ragResult.primaryAgent.confidence
      },
      alternativeAgents: ragResult.alternativeAgents.map(alt => ({
        agentId: alt.agentId,
        agentName: alt.agentName,
        confidence: alt.confidence,
        reasoning: alt.reasoning,
        agentType: alt.agentType,
        capabilities: alt.capabilities,
        estimatedSuccess: alt.confidence
      })),
      taskAnalysis: {
        ...ragResult.taskAnalysis,
        category: blockchainAnalysis.taskType !== 'general' ? 'blockchain' : ragResult.taskAnalysis.category
      },
      reasoning
    };
  }

  /**
   * Determine if a task should be routed to task agents (RAG) vs non-task agents (traditional)
   */
  private shouldUseTaskAgentRouting(taskDescription: string): boolean {
    const taskAgentKeywords = [
      // Blockchain & DeFi
      'transfer', 'send', 'swap', 'stake', 'bridge', 'balance', 'token', 'defi',
      // NFT operations  
      'mint', 'nft', 'deploy', 'contract', 'gasless',
      // Research & Analysis
      'research', 'analyze', 'investigate', 'study', 'report', 'data',
      // Code generation
      'code', 'generate', 'develop', 'build', 'create', 'programming',
      // Document writing
      'document', 'write', 'report', 'documentation', 'markdown',
      // Scheduling
      'schedule', 'automate', 'recurring', 'timer', 'workflow'
    ];

    const nonTaskKeywords = [
      // Companion/conversation
      'chat', 'talk', 'conversation', 'companion', 'hello', 'how are you',
      // Memory/profile
      'remember', 'forget', 'profile', 'preference', 'memory',
      // Task management
      'track', 'status', 'progress', 'orchestrate', 'manage'
    ];
    
    const lowerTask = taskDescription.toLowerCase();
    
    // Use traditional routing only for internal orchestration tasks
    const nonTaskIndicators = [
      'orchestrate', 'coordinate', 'delegate', 'manage task', 'system internal',
      'agent management', 'prompt engineering', 'memory management'
    ];
    
    // Check for non-task indicators - these should use traditional routing
    if (nonTaskIndicators.some(indicator => lowerTask.includes(indicator))) {
      return false;
    }
    
    // Default to RAG-based task agent routing for all user requests
    return true;
  }

  /**
   * Build profiles only for non-task agents (orchestrator, companion, etc)
   */
  private buildNonTaskAgentProfiles(): string {
    const profiles: string[] = [];
    const nonTaskAgents = this.classificationSystem.getNonTaskAgents();
    
    for (const agent of nonTaskAgents) {
      const profile = `
AGENT: ${agent.agentName} (${agent.agentId})
Type: ${agent.category} (${agent.subcategory})
Description: ${agent.description}
Use RAG: ${agent.useRAG ? 'Yes' : 'No'}
Execution Capable: ${agent.executionCapable ? 'Yes' : 'No'}
      `.trim();
      
      profiles.push(profile);
    }
    
    return profiles.join('\n\n');
  }
}