// Simplified Collaborative Planning System for Multi-Agent Task Execution
import { AgentMessage, Task } from '../types/AgentTypes';
import { IntelligentAgentSelector, AgentSelectionRequest, AgentMatch } from './IntelligentAgentSelector';
import { ChainOfThoughtEngine } from '../crewai/ChainOfThoughtEngine';
import { v4 as uuidv4 } from 'uuid';

export interface CollaborationPlan {
  planId: string;
  taskId: string;
  participants: AgentPlanRole[];
  executionSteps: ExecutionStep[];
  contingencies: ContingencyPlan[];
  estimatedDuration: number;
  confidence: number;
  reasoning: string[];
}

export interface AgentPlanRole {
  agentId: string;
  role: 'primary' | 'secondary' | 'fallback' | 'validator';
  capabilities: string[];
  dependencies: string[];
  estimatedEffort: number;
}

export interface ExecutionStep {
  stepId: string;
  agentId: string;
  capability: string;
  inputs: Record<string, any>;
  expectedOutputs: Record<string, any>;
  dependencies: string[];
  parallel: boolean;
}

export interface ContingencyPlan {
  condition: string;
  fallbackAgent: string;
  fallbackCapability: string;
  reasoning: string;
}

export class CollaborativePlanner {
  private intelligentSelector: IntelligentAgentSelector;
  private chainOfThought: ChainOfThoughtEngine;
  private activePlans: Map<string, CollaborationPlan> = new Map();

  constructor(intelligentSelector: IntelligentAgentSelector) {
    this.intelligentSelector = intelligentSelector;
    this.chainOfThought = new ChainOfThoughtEngine();
  }

  // Create collaborative execution plan for complex tasks
  async createCollaborationPlan(task: Task, context: Record<string, any>): Promise<CollaborationPlan> {
    console.log('[CollaborativePlanner] Creating collaboration plan', { taskId: task.id, taskType: task.type });

    // For now, create a simplified plan that delegates to a single intelligent agent
    // This maintains compatibility while we transition to AI-powered selection
    const selectionRequest: AgentSelectionRequest = {
      taskDescription: task.description,
      taskType: task.type || 'general',
      priority: task.priority,
      context: {
        ...context,
        isCollaborative: true
      },
      userId: task.userId
    };

    const selectionResult = await this.intelligentSelector.selectBestAgent(selectionRequest);
    const primaryAgent = selectionResult.primaryAgent;

    // Create a simple collaboration plan
    const plan: CollaborationPlan = {
      planId: uuidv4(),
      taskId: task.id!,
      participants: [
        {
          agentId: primaryAgent.agentId,
          role: 'primary',
          capabilities: primaryAgent.capabilities,
          dependencies: [],
          estimatedEffort: 1.0
        }
      ],
      executionSteps: [
        {
          stepId: uuidv4(),
          agentId: primaryAgent.agentId,
          capability: selectionResult.taskAnalysis.category,
          inputs: {
            taskDescription: task.description,
            userId: task.userId,
            parameters: task.parameters || {}
          },
          expectedOutputs: {
            result: 'task_completion',
            status: 'completed'
          },
          dependencies: [],
          parallel: false
        }
      ],
      contingencies: [],
      estimatedDuration: 5000, // 5 seconds default
      confidence: primaryAgent.confidence,
      reasoning: [
        'Simplified collaborative plan using intelligent agent selection',
        `Primary agent: ${primaryAgent.agentId} (confidence: ${(primaryAgent.confidence * 100).toFixed(1)}%)`,
        ...primaryAgent.reasoning
      ]
    };

    this.activePlans.set(plan.planId, plan);
    console.log('[CollaborativePlanner] Plan created', { planId: plan.planId, primaryAgent: primaryAgent.agentId });

    return plan;
  }

  // Negotiate agent assignment (simplified version)
  async negotiateAgentAssignment(candidateAgents: AgentMatch[], requirements: any[]): Promise<AgentMatch[]> {
    // For now, just return the candidates as-is
    // In the future, this could implement actual negotiation logic
    return candidateAgents;
  }

  // Get active plan by ID
  getActivePlan(planId: string): CollaborationPlan | undefined {
    return this.activePlans.get(planId);
  }

  // Remove completed plan
  removePlan(planId: string): void {
    this.activePlans.delete(planId);
  }

  // Get all active plans
  getActivePlans(): CollaborationPlan[] {
    return Array.from(this.activePlans.values());
  }
}