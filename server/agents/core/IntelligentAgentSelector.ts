// AI-Powered Intelligent Agent Selector - Natural language understanding for agent selection
import OpenAI from 'openai';
import { AgentConfigManager } from '../../config/AgentConfigManager';
import { AgentConfig } from '../../config/AgentConfigManager';

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

  constructor() {
    // Force fresh OpenAI client initialization (clean any whitespace)
    const apiKey = process.env.OPENAI_API_KEY?.replace(/\s+/g, '') || '';
    this.openai = new OpenAI({ apiKey });
    this.configManager = new AgentConfigManager();
    this.loadAgentConfigurations();
    console.log('[IntelligentAgentSelector] OpenAI client initialized with fresh API key');
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
   * Select the best agent(s) for a task using AI-powered analysis
   */
  async selectBestAgent(request: AgentSelectionRequest): Promise<AgentSelectionResult> {
    try {
      // Use AI to analyze the task and match to agent descriptions
      const agentProfiles = this.buildAgentProfiles();
      
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
}