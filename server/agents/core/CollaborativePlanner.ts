// Collaborative Planning System for Multi-Agent Task Execution
import { AgentMessage, Task } from '../types/AgentTypes';
import { CapabilityRegistry, AgentCapabilityMatch, TaskRequirement } from './CapabilityRegistry';
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
  private capabilityRegistry: CapabilityRegistry;
  private chainOfThought: ChainOfThoughtEngine;
  private activePlans: Map<string, CollaborationPlan> = new Map();

  constructor(capabilityRegistry: CapabilityRegistry) {
    this.capabilityRegistry = capabilityRegistry;
    this.chainOfThought = new ChainOfThoughtEngine();
  }

  // Create collaborative execution plan for complex tasks
  async createCollaborationPlan(task: Task, context: Record<string, any>): Promise<CollaborationPlan> {
    console.log('[CollaborativePlanner] Creating collaboration plan', { taskId: task.id, taskType: task.type });

    // Analyze task requirements
    const requirements = this.analyzeTaskRequirements(task, context);
    
    // Find suitable agents for each requirement
    const agentMatches = this.findCollaborativeAgents(requirements);
    
    // Generate chain of thought for planning
    const planningReasoning = await this.generatePlanningChainOfThought(task, requirements, agentMatches);
    
    // Create execution plan
    const plan: CollaborationPlan = {
      planId: uuidv4(),
      taskId: task.id!,
      participants: this.assignRoles(agentMatches, requirements),
      executionSteps: this.createExecutionSteps(agentMatches, requirements, task),
      contingencies: this.createContingencyPlans(agentMatches, requirements),
      estimatedDuration: this.estimateExecutionTime(agentMatches, requirements),
      confidence: this.calculatePlanConfidence(agentMatches, requirements),
      reasoning: planningReasoning
    };

    this.activePlans.set(plan.planId, plan);
    
    console.log('[CollaborativePlanner] Collaboration plan created', {
      planId: plan.planId,
      participants: plan.participants.length,
      steps: plan.executionSteps.length,
      confidence: plan.confidence
    });

    return plan;
  }

  // Negotiate optimal agent assignment through peer communication
  async negotiateAgentAssignment(
    candidates: AgentCapabilityMatch[], 
    requirements: TaskRequirement[]
  ): Promise<AgentCapabilityMatch[]> {
    console.log('[CollaborativePlanner] Starting agent negotiation', { 
      candidates: candidates.length, 
      requirements: requirements.length 
    });

    const negotiations: AgentNegotiation[] = [];

    // Create negotiation scenarios
    for (const requirement of requirements) {
      const suitableCandidates = candidates.filter(c => 
        requirement.requiredCapabilities.includes(c.capability.capabilityName)
      );

      if (suitableCandidates.length > 1) {
        // Multiple agents can handle this - negotiate
        const negotiation = await this.conductCapabilityNegotiation(requirement, suitableCandidates);
        negotiations.push(negotiation);
      }
    }

    // Apply negotiation results
    return this.applyNegotiationResults(candidates, negotiations);
  }

  // Generate dynamic reasoning for task planning
  private async generatePlanningChainOfThought(
    task: Task, 
    requirements: TaskRequirement[], 
    matches: AgentCapabilityMatch[]
  ): Promise<string[]> {
    const reasoning: string[] = [];

    reasoning.push(`Analyzing task: ${task.description}`);
    reasoning.push(`Task type: ${task.type}, Priority: ${task.priority}`);
    
    // Requirement analysis reasoning
    reasoning.push(`Identified ${requirements.length} key requirements:`);
    requirements.forEach((req, i) => {
      reasoning.push(`  ${i+1}. ${req.taskType} (${req.priority} priority, ${req.securityLevel} security)`);
    });

    // Agent selection reasoning
    reasoning.push(`Found ${matches.length} capable agents:`);
    matches.slice(0, 3).forEach(match => {
      reasoning.push(`  - ${match.agentId}: ${match.reasoning} (score: ${match.score.toFixed(2)})`);
    });

    // Collaboration strategy reasoning
    const collaborationComplexity = this.assessCollaborationComplexity(requirements, matches);
    reasoning.push(`Collaboration complexity: ${collaborationComplexity}`);
    
    if (collaborationComplexity === 'high') {
      reasoning.push('Implementing sequential execution with validation checkpoints');
    } else if (collaborationComplexity === 'medium') {
      reasoning.push('Implementing parallel execution where possible with dependency management');
    } else {
      reasoning.push('Implementing simple primary-fallback execution pattern');
    }

    return reasoning;
  }

  private analyzeTaskRequirements(task: Task, context: Record<string, any>): TaskRequirement[] {
    const requirements: TaskRequirement[] = [];

    // Base requirement from task type
    const baseRequirement: TaskRequirement = {
      taskType: task.type || 'general',
      priority: task.priority,
      securityLevel: this.determineSecurityLevel(task, context),
      maxLatency: this.determineMaxLatency(task.priority),
      requiredCapabilities: this.mapTaskTypeToCapabilities(task.type || 'general'),
      context: context
    };

    requirements.push(baseRequirement);

    // Add additional requirements based on task complexity
    if (this.isComplexTask(task)) {
      requirements.push({
        taskType: 'validation',
        priority: task.priority,
        securityLevel: baseRequirement.securityLevel,
        requiredCapabilities: ['feasibility_analysis'],
        context: context
      });
    }

    return requirements;
  }

  private findCollaborativeAgents(requirements: TaskRequirement[]): AgentCapabilityMatch[] {
    let allMatches: AgentCapabilityMatch[] = [];

    for (const requirement of requirements) {
      const matches = this.capabilityRegistry.findBestAgentsForTask(requirement);
      allMatches = [...allMatches, ...matches];
    }

    // Remove duplicates and sort by score
    const uniqueMatches = allMatches.reduce((acc, match) => {
      const key = `${match.agentId}-${match.capability.capabilityName}`;
      if (!acc.has(key) || acc.get(key)!.score < match.score) {
        acc.set(key, match);
      }
      return acc;
    }, new Map<string, AgentCapabilityMatch>());

    return Array.from(uniqueMatches.values()).sort((a, b) => b.score - a.score);
  }

  private assignRoles(matches: AgentCapabilityMatch[], requirements: TaskRequirement[]): AgentPlanRole[] {
    const roles: AgentPlanRole[] = [];
    const usedAgents = new Set<string>();

    // Assign primary roles
    for (const requirement of requirements) {
      const suitableMatches = matches.filter(m => 
        requirement.requiredCapabilities.includes(m.capability.capabilityName) &&
        !usedAgents.has(m.agentId)
      );

      if (suitableMatches.length > 0) {
        const primaryMatch = suitableMatches[0];
        roles.push({
          agentId: primaryMatch.agentId,
          role: 'primary',
          capabilities: [primaryMatch.capability.capabilityName],
          dependencies: primaryMatch.capability.dependencies,
          estimatedEffort: this.estimateEffort(requirement, primaryMatch.capability)
        });
        usedAgents.add(primaryMatch.agentId);

        // Assign fallback if available
        if (suitableMatches.length > 1) {
          const fallbackMatch = suitableMatches[1];
          roles.push({
            agentId: fallbackMatch.agentId,
            role: 'fallback',
            capabilities: [fallbackMatch.capability.capabilityName],
            dependencies: fallbackMatch.capability.dependencies,
            estimatedEffort: this.estimateEffort(requirement, fallbackMatch.capability) * 0.5
          });
        }
      }
    }

    return roles;
  }

  private createExecutionSteps(
    matches: AgentCapabilityMatch[], 
    requirements: TaskRequirement[], 
    task: Task
  ): ExecutionStep[] {
    const steps: ExecutionStep[] = [];
    let stepOrder = 0;

    for (const requirement of requirements) {
      const suitableMatch = matches.find(m => 
        requirement.requiredCapabilities.includes(m.capability.capabilityName)
      );

      if (suitableMatch) {
        const step: ExecutionStep = {
          stepId: `step-${++stepOrder}`,
          agentId: suitableMatch.agentId,
          capability: suitableMatch.capability.capabilityName,
          inputs: this.generateInputsForStep(requirement, task),
          expectedOutputs: suitableMatch.capability.outputSchema,
          dependencies: this.determineDependencies(suitableMatch.capability, steps),
          parallel: this.canExecuteInParallel(suitableMatch.capability, steps)
        };
        steps.push(step);
      }
    }

    return steps;
  }

  private createContingencyPlans(
    matches: AgentCapabilityMatch[], 
    requirements: TaskRequirement[]
  ): ContingencyPlan[] {
    const contingencies: ContingencyPlan[] = [];

    for (const requirement of requirements) {
      const suitableMatches = matches.filter(m => 
        requirement.requiredCapabilities.includes(m.capability.capabilityName)
      );

      if (suitableMatches.length > 1) {
        const primary = suitableMatches[0];
        const fallback = suitableMatches[1];

        contingencies.push({
          condition: `${primary.agentId} fails or overloaded`,
          fallbackAgent: fallback.agentId,
          fallbackCapability: fallback.capability.capabilityName,
          reasoning: `Fallback: ${fallback.reasoning}`
        });
      }
    }

    return contingencies;
  }

  // Helper methods
  private determineSecurityLevel(task: Task, context: Record<string, any>): 'low' | 'medium' | 'high' {
    const taskType = task.type?.toLowerCase();
    if (taskType?.includes('transfer') || taskType?.includes('deploy') || taskType?.includes('mint')) {
      return 'high';
    }
    if (taskType?.includes('balance') || taskType?.includes('check')) {
      return 'medium';
    }
    return 'low';
  }

  private determineMaxLatency(priority: string): number {
    switch (priority) {
      case 'high': return 5000;
      case 'medium': return 15000;
      case 'low': return 30000;
      default: return 15000;
    }
  }

  private mapTaskTypeToCapabilities(taskType: string): string[] {
    const mapping: Record<string, string[]> = {
      'nft_mint': ['nft_mint'],
      'balance_check': ['balance_check'],
      'token_transfer': ['token_transfer'],
      'contract_deployment': ['contract_deployment'],
      'conversation': ['conversation'],
      'task_detection': ['task_detection'],
      'feasibility_analysis': ['feasibility_analysis']
    };
    return mapping[taskType] || ['conversation'];
  }

  private isComplexTask(task: Task): boolean {
    const complexTaskTypes = ['contract_deployment', 'token_transfer', 'nft_mint'];
    return complexTaskTypes.includes(task.type || '');
  }

  private assessCollaborationComplexity(
    requirements: TaskRequirement[], 
    matches: AgentCapabilityMatch[]
  ): 'low' | 'medium' | 'high' {
    if (requirements.length > 3 || matches.length > 4) return 'high';
    if (requirements.length > 1 || matches.length > 2) return 'medium';
    return 'low';
  }

  private estimateEffort(requirement: TaskRequirement, capability: any): number {
    return capability.estimatedLatency / 1000; // Convert to effort score
  }

  private generateInputsForStep(requirement: TaskRequirement, task: Task): Record<string, any> {
    return {
      taskId: task.id,
      userId: task.userId,
      description: task.description,
      parameters: task.parameters,
      context: requirement.context
    };
  }

  private determineDependencies(capability: any, existingSteps: ExecutionStep[]): string[] {
    return capability.dependencies.map((dep: string) => {
      const dependentStep = existingSteps.find(step => 
        step.capability.includes(dep) || step.stepId.includes(dep)
      );
      return dependentStep?.stepId || dep;
    });
  }

  private canExecuteInParallel(capability: any, existingSteps: ExecutionStep[]): boolean {
    return capability.dependencies.length === 0 || 
           !capability.dependencies.some((dep: string) => 
             existingSteps.some(step => step.capability.includes(dep))
           );
  }

  private estimateExecutionTime(matches: AgentCapabilityMatch[], requirements: TaskRequirement[]): number {
    return matches.reduce((total, match) => total + match.capability.estimatedLatency, 0);
  }

  private calculatePlanConfidence(matches: AgentCapabilityMatch[], requirements: TaskRequirement[]): number {
    if (matches.length === 0) return 0;
    const avgScore = matches.reduce((sum, match) => sum + match.score, 0) / matches.length;
    const coverageScore = Math.min(1, matches.length / requirements.length);
    return (avgScore * 0.7 + coverageScore * 0.3);
  }

  private async conductCapabilityNegotiation(
    requirement: TaskRequirement, 
    candidates: AgentCapabilityMatch[]
  ): Promise<AgentNegotiation> {
    // Simulate agent negotiation based on current load, success rate, and cost
    const negotiationResults = candidates.map(candidate => ({
      agentId: candidate.agentId,
      bid: {
        estimatedTime: candidate.capability.estimatedLatency,
        cost: candidate.capability.cost,
        confidence: candidate.capability.successRate,
        currentLoad: candidate.capability.currentLoad
      },
      priority: this.calculateNegotiationPriority(candidate, requirement)
    }));

    const winner = negotiationResults.reduce((best, current) => 
      current.priority > best.priority ? current : best
    );

    return {
      requirement,
      candidates,
      winner: winner.agentId,
      reasoning: `Selected ${winner.agentId} based on optimal balance of performance, cost, and availability`
    };
  }

  private calculateNegotiationPriority(candidate: AgentCapabilityMatch, requirement: TaskRequirement): number {
    let priority = candidate.score;
    
    // Adjust for current load (prefer less loaded agents)
    priority *= (1 - candidate.capability.currentLoad);
    
    // Adjust for cost (prefer lower cost if priority is not high)
    if (requirement.priority !== 'high') {
      priority *= (1 - candidate.capability.cost * 0.3);
    }
    
    return priority;
  }

  private applyNegotiationResults(
    candidates: AgentCapabilityMatch[], 
    negotiations: AgentNegotiation[]
  ): AgentCapabilityMatch[] {
    // Apply negotiation results by reordering candidates based on negotiation outcomes
    const negotiatedOrder = negotiations.map(n => n.winner);
    const reordered = [...candidates];
    
    // Boost scores of negotiation winners
    reordered.forEach(candidate => {
      if (negotiatedOrder.includes(candidate.agentId)) {
        candidate.score = Math.min(1, candidate.score * 1.1);
      }
    });
    
    return reordered.sort((a, b) => b.score - a.score);
  }
}

interface AgentNegotiation {
  requirement: TaskRequirement;
  candidates: AgentCapabilityMatch[];
  winner: string;
  reasoning: string;
}