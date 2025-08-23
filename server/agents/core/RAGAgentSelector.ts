// RAG-Enhanced Agent Selection System
// Uses embeddings and semantic search for intelligent agent matching

import OpenAI from 'openai';
import { AgentConfigManager } from '../../config/AgentConfigManager';
import { AgentConfig } from '../../config/AgentConfigManager';
import { AgentClassificationSystem, AgentCategory, AgentClassification } from './AgentClassificationSystem';

export interface AgentEmbedding {
  agentId: string;
  agentName: string;
  description: string;
  capabilities: string[];
  useCases: string[];
  embedding: number[];
  agentType: 'core' | 'specialized' | 'mcp' | 'support';
  executionCapable: boolean;
}

export interface RAGSelectionRequest {
  taskDescription: string;
  taskType?: string;
  priority: 'low' | 'medium' | 'high';
  context?: Record<string, any>;
  userId?: string;
  requireExecution?: boolean; // Prefer MCP agents for real execution
}

export interface RAGMatch {
  agentId: string;
  agentName: string;
  confidence: number;
  semanticSimilarity: number;
  reasoning: string[];
  agentType: string;
  capabilities: string[];
  useCases: string[];
  executionCapable: boolean;
}

export interface RAGSelectionResult {
  primaryAgent: RAGMatch;
  alternativeAgents: RAGMatch[];
  taskAnalysis: {
    category: string;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedDuration: string;
    requiredCapabilities: string[];
    needsExecution: boolean;
  };
  semanticReasoning: string[];
}

export class RAGAgentSelector {
  private openai: OpenAI;
  private configManager: AgentConfigManager;
  private classificationSystem: AgentClassificationSystem;
  private agentEmbeddings: Map<string, AgentEmbedding> = new Map();
  private isInitialized = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY?.replace(/\s+/g, '') || '';
    this.openai = new OpenAI({ apiKey });
    this.configManager = new AgentConfigManager();
    this.classificationSystem = new AgentClassificationSystem();
    this.initializeRAGSystem();
  }

  private async initializeRAGSystem(): Promise<void> {
    try {
      console.log('[RAGAgentSelector] Initializing RAG system for TASK AGENTS ONLY...');
      
      // Only generate embeddings for task agents (not orchestrator/companion/etc)
      const taskAgents = this.classificationSystem.getTaskAgents();
      
      console.log(`[RAGAgentSelector] Found ${taskAgents.length} task agents for RAG processing`);
      
      // Generate embeddings only for task agents
      for (const taskAgent of taskAgents) {
        await this.generateTaskAgentEmbedding(taskAgent);
      }
      
      this.isInitialized = true;
      console.log(`[RAGAgentSelector] RAG system initialized with ${this.agentEmbeddings.size} TASK agent embeddings (non-task agents excluded)`);
    } catch (error) {
      console.error('[RAGAgentSelector] Failed to initialize RAG system:', error);
    }
  }

  private async generateTaskAgentEmbedding(taskAgent: AgentClassification): Promise<void> {
    try {
      // Create comprehensive agent description with name, description, keywords, and use cases
      const agentDescription = this.buildTaskAgentDescriptionForEmbedding(taskAgent);
      
      // Generate embedding using OpenAI
      const embeddingResponse = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: agentDescription,
        encoding_format: "float"
      });

      const embedding: AgentEmbedding = {
        agentId: taskAgent.agentId,
        agentName: taskAgent.agentName,
        description: taskAgent.description,
        capabilities: taskAgent.keywords, // Use keywords as capabilities
        useCases: taskAgent.useCases,
        embedding: embeddingResponse.data[0].embedding,
        agentType: taskAgent.subcategory as string,
        executionCapable: taskAgent.executionCapable
      };

      this.agentEmbeddings.set(taskAgent.agentId, embedding);
      console.log(`[RAGAgentSelector] Generated embedding for TASK agent: ${taskAgent.agentName}`);
      
    } catch (error) {
      console.error(`[RAGAgentSelector] Failed to generate embedding for ${taskAgent.agentId}:`, error);
    }
  }

  private buildAgentDescriptionForEmbedding(config: AgentConfig): string {
    return `
Agent: ${config.name}
Description: ${config.description}
Role: ${config.role}
Capabilities: ${config.capabilities?.join(', ') || 'None'}
Use Cases: ${config.useCases?.join(', ') || 'None'}
Agent Type: ${config.agentType}
Specializations: ${config.keywords?.join(', ') || 'None'}
Performance: Success Rate ${config.performanceMetrics?.successRate}%, Latency ${config.performanceMetrics?.averageLatency}ms
    `.trim();
  }

  private isExecutionCapableAgent(config: AgentConfig): boolean {
    // MCP agents and specialized agents can execute, others mostly plan/analyze
    return config.agentType === 'mcp' || 
           config.agentType === 'specialized' ||
           (config.capabilities?.some(cap => 
             cap.includes('execution') || 
             cap.includes('blockchain_operations') ||
             cap.includes('deployment')
           ) ?? false);
  }

  /**
   * Select best agent using RAG semantic matching
   */
  async selectBestAgent(request: RAGSelectionRequest): Promise<RAGSelectionResult> {
    if (!this.isInitialized) {
      // Fallback to basic selection if RAG not ready
      console.warn('[RAGAgentSelector] RAG not initialized, using fallback selection');
      return await this.fallbackSelection(request);
    }

    try {
      // Generate task embedding
      const taskEmbedding = await this.generateTaskEmbedding(request.taskDescription);
      
      // Calculate semantic similarities
      const matches = await this.calculateSemanticMatches(taskEmbedding, request);
      
      // Analyze task requirements
      const taskAnalysis = await this.analyzeTaskRequirements(request);
      
      // If execution is needed, prioritize MCP agents
      if (request.requireExecution || taskAnalysis.needsExecution) {
        matches.sort((a, b) => {
          if (a.executionCapable && !b.executionCapable) return -1;
          if (!a.executionCapable && b.executionCapable) return 1;
          return b.confidence - a.confidence;
        });
      }

      const primaryAgent = matches[0];
      const alternativeAgents = matches.slice(1, 4); // Top 3 alternatives

      return {
        primaryAgent,
        alternativeAgents,
        taskAnalysis,
        semanticReasoning: [
          `Task "${request.taskDescription}" matched semantically to ${primaryAgent.agentName}`,
          `Semantic similarity: ${(primaryAgent.semanticSimilarity * 100).toFixed(1)}%`,
          `Agent type: ${primaryAgent.agentType}`,
          `Execution capable: ${primaryAgent.executionCapable ? 'Yes' : 'No'}`,
          `Use cases: ${primaryAgent.useCases.slice(0, 3).join(', ')}`
        ]
      };

    } catch (error) {
      console.error('[RAGAgentSelector] Error in RAG selection:', error);
      return await this.fallbackSelection(request);
    }
  }

  private async generateTaskEmbedding(taskDescription: string): Promise<number[]> {
    const embeddingResponse = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: taskDescription,
      encoding_format: "float"
    });
    return embeddingResponse.data[0].embedding;
  }

  private async calculateSemanticMatches(taskEmbedding: number[], request: RAGSelectionRequest): Promise<RAGMatch[]> {
    const matches: RAGMatch[] = [];

    for (const [agentId, agentEmb] of this.agentEmbeddings) {
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(taskEmbedding, agentEmb.embedding);
      
      // Generate reasoning with AI
      const reasoning = await this.generateMatchReasoning(request.taskDescription, agentEmb);
      
      matches.push({
        agentId,
        agentName: agentEmb.agentName,
        confidence: similarity,
        semanticSimilarity: similarity,
        reasoning,
        agentType: agentEmb.agentType,
        capabilities: agentEmb.capabilities,
        useCases: agentEmb.useCases,
        executionCapable: agentEmb.executionCapable
      });
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private async generateMatchReasoning(taskDescription: string, agentEmb: AgentEmbedding): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: `Analyze why the agent "${agentEmb.agentName}" is a good match for the task. Consider:
- Agent capabilities: ${agentEmb.capabilities.join(', ')}
- Agent use cases: ${agentEmb.useCases.join(', ')}
- Task description: "${taskDescription}"
- Agent type: ${agentEmb.agentType}
- Execution capable: ${agentEmb.executionCapable}

Provide 2-3 concise reasons why this agent matches the task.`
        }],
        max_tokens: 100,
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      return response.reasons || [`${agentEmb.agentName} has relevant capabilities for this task`];
    } catch (error) {
      return [`${agentEmb.agentName} matched based on capabilities and use cases`];
    }
  }

  private async analyzeTaskRequirements(request: RAGSelectionRequest): Promise<any> {
    // Simple task analysis - could be enhanced with more AI
    const needsExecution = request.requireExecution || 
                          request.taskDescription.toLowerCase().includes('transfer') ||
                          request.taskDescription.toLowerCase().includes('deploy') ||
                          request.taskDescription.toLowerCase().includes('mint') ||
                          request.taskDescription.toLowerCase().includes('execute');

    return {
      category: this.categorizeTask(request.taskDescription),
      complexity: 'moderate',
      estimatedDuration: 'short',
      requiredCapabilities: this.extractRequiredCapabilities(request.taskDescription),
      needsExecution
    };
  }

  private categorizeTask(taskDescription: string): string {
    const lower = taskDescription.toLowerCase();
    if (lower.includes('blockchain') || lower.includes('token') || lower.includes('nft')) return 'blockchain';
    if (lower.includes('code') || lower.includes('develop')) return 'development';
    if (lower.includes('research') || lower.includes('analyze')) return 'research';
    return 'general';
  }

  private extractRequiredCapabilities(taskDescription: string): string[] {
    const capabilities = [];
    const lower = taskDescription.toLowerCase();
    
    if (lower.includes('transfer')) capabilities.push('token_transfer');
    if (lower.includes('deploy')) capabilities.push('contract_deployment');
    if (lower.includes('mint')) capabilities.push('nft_mint');
    if (lower.includes('balance')) capabilities.push('balance_check');
    
    return capabilities;
  }

  private async fallbackSelection(request: RAGSelectionRequest): Promise<RAGSelectionResult> {
    // Simple fallback when RAG is not available
    return {
      primaryAgent: {
        agentId: 'goat-mcp',
        agentName: 'GoatMCP',
        confidence: 0.5,
        semanticSimilarity: 0.5,
        reasoning: ['Fallback selection for blockchain operations'],
        agentType: 'mcp',
        capabilities: ['blockchain_operations'],
        useCases: ['token transfers', 'blockchain operations'],
        executionCapable: true
      },
      alternativeAgents: [],
      taskAnalysis: {
        category: 'blockchain',
        complexity: 'moderate',
        estimatedDuration: 'short',
        requiredCapabilities: [],
        needsExecution: true
      },
      semanticReasoning: ['Using fallback selection due to RAG initialization']
    };
  }
}