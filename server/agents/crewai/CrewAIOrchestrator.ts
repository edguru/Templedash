// CrewAI-Powered Chain of Thought Orchestrator
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage, Task, UserProfile, ConversationContext } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

export interface CrewAIAgent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  capabilities: string[];
  reasoningStyle: 'analytical' | 'creative' | 'strategic' | 'collaborative';
  tools: string[];
  verbose: boolean;
  allowDelegation: boolean;
}

export interface CrewAITask {
  id: string;
  description: string;
  expectedOutput: string;
  agent: string;
  context?: string[];
  dependencies?: string[];
  reasoning?: ChainOfThoughtStep[];
  status: 'pending' | 'reasoning' | 'executing' | 'reviewing' | 'completed' | 'failed';
}

export interface ChainOfThoughtStep {
  stepNumber: number;
  type: 'observation' | 'thought' | 'action' | 'reflection';
  content: string;
  reasoning: string;
  confidence: number;
  timestamp: string;
  agentId: string;
}

export interface CrewConfiguration {
  agents: CrewAIAgent[];
  tasks: CrewAITask[];
  process: 'sequential' | 'hierarchical' | 'parallel';
  memory: boolean;
  verbose: boolean;
  maxIterations: number;
  reasoningDepth: 'shallow' | 'medium' | 'deep';
}

export class CrewAIOrchestrator extends BaseAgent {
  private crews: Map<string, CrewConfiguration> = new Map();
  private activeReasoningChains: Map<string, ChainOfThoughtStep[]> = new Map();
  private agentRoles: Map<string, CrewAIAgent> = new Map();
  private taskDependencies: Map<string, string[]> = new Map();

  protected initialize(): void {
    this.logActivity('Initializing CrewAI Orchestrator');
    this.initializeDefaultCrew();
  }

  private initializeDefaultCrew(): void {
    const defaultAgents: CrewAIAgent[] = [
      {
        id: 'senior-researcher',
        role: 'Senior Research Analyst',
        goal: 'Research and analyze complex information with detailed step-by-step reasoning',
        backstory: 'Expert researcher who breaks down complex problems systematically, showing reasoning process clearly.',
        capabilities: ['research', 'analysis', 'data-synthesis'],
        reasoningStyle: 'analytical',
        tools: ['web-search', 'documentation-analysis'],
        verbose: true,
        allowDelegation: false
      },
      {
        id: 'strategic-planner',
        role: 'Strategic Task Planner',
        goal: 'Develop multi-step strategies through systematic reasoning and planning',
        backstory: 'Expert in strategic thinking who considers multiple perspectives and long-term implications.',
        capabilities: ['planning', 'strategy', 'resource-allocation'],
        reasoningStyle: 'strategic',
        tools: ['task-breakdown', 'resource-analysis'],
        verbose: true,
        allowDelegation: true
      },
      {
        id: 'web3-executor',
        role: 'Web3 Operations Specialist',
        goal: 'Execute blockchain operations with clear reasoning and safety checks',
        backstory: 'Blockchain expert who thinks through every transaction step-by-step for security and efficiency.',
        capabilities: ['blockchain', 'smart-contracts', 'defi'],
        reasoningStyle: 'analytical',
        tools: ['goat-mcp', 'thirdweb-signer'],
        verbose: true,
        allowDelegation: false
      },
      {
        id: 'reasoning-validator',
        role: 'Reasoning Quality Validator',
        goal: 'Review and validate reasoning chains for logical consistency and quality',
        backstory: 'Expert in logical reasoning and quality assurance who identifies gaps and improvements.',
        capabilities: ['validation', 'logic-review', 'quality-assurance'],
        reasoningStyle: 'analytical',
        tools: ['reasoning-analysis', 'logic-checker'],
        verbose: true,
        allowDelegation: false
      }
    ];

    // Register agents with the system
    defaultAgents.forEach(agent => {
      this.agentRoles.set(agent.id, agent);
    });

    this.logActivity('Default CrewAI agents initialized', { agentCount: defaultAgents.length });
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    switch (message.type) {
      case 'crew_task_request':
        return this.handleCrewTaskRequest(message);
      case 'reasoning_chain_start':
        return this.startReasoningChain(message);
      case 'reasoning_step_complete':
        return this.handleReasoningStep(message);
      case 'crew_status_request':
        return this.getCrewStatus(message);
      default:
        return null;
    }
  }

  private async handleCrewTaskRequest(message: AgentMessage): Promise<AgentMessage> {
    const { taskDescription, complexity, userContext } = message.payload;
    
    // Initialize chain of thought reasoning
    const reasoningChainId = uuidv4();
    const initialStep: ChainOfThoughtStep = {
      stepNumber: 1,
      type: 'observation',
      content: `Received task: ${taskDescription}`,
      reasoning: 'Analyzing task requirements and complexity to determine optimal crew configuration.',
      confidence: 0.9,
      timestamp: new Date().toISOString(),
      agentId: this.agentId
    };

    this.activeReasoningChains.set(reasoningChainId, [initialStep]);

    // Step 2: Task Analysis
    const analysisStep: ChainOfThoughtStep = {
      stepNumber: 2,
      type: 'thought',
      content: `Task complexity: ${complexity}. Required capabilities: ${this.analyzeRequiredCapabilities(taskDescription)}`,
      reasoning: 'Breaking down task into components to identify which agents are needed and in what order.',
      confidence: 0.85,
      timestamp: new Date().toISOString(),
      agentId: this.agentId
    };

    this.activeReasoningChains.get(reasoningChainId)!.push(analysisStep);

    // Step 3: Crew Selection
    const selectedCrew = this.selectOptimalCrew(taskDescription, complexity);
    const selectionStep: ChainOfThoughtStep = {
      stepNumber: 3,
      type: 'action',
      content: `Selected crew: ${selectedCrew.agents.map(a => a.role).join(', ')}`,
      reasoning: 'Chose agents based on required capabilities and reasoning styles that complement each other.',
      confidence: 0.88,
      timestamp: new Date().toISOString(),
      agentId: this.agentId
    };

    this.activeReasoningChains.get(reasoningChainId)!.push(selectionStep);

    // Create and execute crew tasks
    const crewTasks = await this.createCrewTasks(taskDescription, selectedCrew, reasoningChainId);
    
    return {
      type: 'crew_task_started',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        reasoningChainId,
        crewId: selectedCrew.agents[0].id,
        tasks: crewTasks,
        reasoningSteps: this.activeReasoningChains.get(reasoningChainId),
        estimatedCompletion: this.estimateCompletionTime(crewTasks)
      }
    };
  }

  private analyzeRequiredCapabilities(taskDescription: string): string[] {
    const capabilities: string[] = [];
    
    // Simple keyword-based analysis (could be enhanced with LLM)
    if (taskDescription.toLowerCase().includes('research') || taskDescription.toLowerCase().includes('analyze')) {
      capabilities.push('research', 'analysis');
    }
    if (taskDescription.toLowerCase().includes('blockchain') || taskDescription.toLowerCase().includes('web3')) {
      capabilities.push('blockchain', 'smart-contracts');
    }
    if (taskDescription.toLowerCase().includes('plan') || taskDescription.toLowerCase().includes('strategy')) {
      capabilities.push('planning', 'strategy');
    }
    
    return capabilities.length > 0 ? capabilities : ['general'];
  }

  private selectOptimalCrew(taskDescription: string, complexity: string): CrewConfiguration {
    const requiredCapabilities = this.analyzeRequiredCapabilities(taskDescription);
    const selectedAgents: CrewAIAgent[] = [];

    // Always include a strategic planner for complex tasks
    if (complexity === 'high' || complexity === 'medium') {
      const planner = this.agentRoles.get('strategic-planner');
      if (planner) selectedAgents.push(planner);
    }

    // Add capability-specific agents
    requiredCapabilities.forEach(capability => {
      const agent = Array.from(this.agentRoles.values())
        .find(a => a.capabilities.includes(capability));
      if (agent && !selectedAgents.find(sa => sa.id === agent.id)) {
        selectedAgents.push(agent);
      }
    });

    // Always add reasoning validator for quality assurance
    const validator = this.agentRoles.get('reasoning-validator');
    if (validator && !selectedAgents.find(sa => sa.id === validator.id)) {
      selectedAgents.push(validator);
    }

    return {
      agents: selectedAgents,
      tasks: [],
      process: complexity === 'high' ? 'hierarchical' : 'sequential',
      memory: true,
      verbose: true,
      maxIterations: complexity === 'high' ? 10 : 5,
      reasoningDepth: complexity === 'high' ? 'deep' : 'medium'
    };
  }

  private async createCrewTasks(
    taskDescription: string, 
    crew: CrewConfiguration, 
    reasoningChainId: string
  ): Promise<CrewAITask[]> {
    const tasks: CrewAITask[] = [];

    // Create tasks based on crew process type
    if (crew.process === 'sequential') {
      // Sequential task creation with dependencies
      for (let i = 0; i < crew.agents.length; i++) {
        const agent = crew.agents[i];
        const task: CrewAITask = {
          id: uuidv4(),
          description: this.generateTaskDescription(taskDescription, agent),
          expectedOutput: this.generateExpectedOutput(agent),
          agent: agent.id,
          context: i > 0 ? [tasks[i - 1].id] : undefined,
          dependencies: i > 0 ? [tasks[i - 1].id] : undefined,
          reasoning: [],
          status: 'pending'
        };
        tasks.push(task);
      }
    } else if (crew.process === 'hierarchical') {
      // Hierarchical task creation with manager coordination
      const manager = crew.agents.find(a => a.allowDelegation);
      if (manager) {
        const managerTask: CrewAITask = {
          id: uuidv4(),
          description: `Coordinate and manage the execution of: ${taskDescription}`,
          expectedOutput: 'Complete task coordination with delegation and quality review',
          agent: manager.id,
          reasoning: [],
          status: 'pending'
        };
        tasks.push(managerTask);

        // Add subordinate tasks
        crew.agents.filter(a => a.id !== manager.id).forEach(agent => {
          const task: CrewAITask = {
            id: uuidv4(),
            description: this.generateTaskDescription(taskDescription, agent),
            expectedOutput: this.generateExpectedOutput(agent),
            agent: agent.id,
            context: [managerTask.id],
            dependencies: [managerTask.id],
            reasoning: [],
            status: 'pending'
          };
          tasks.push(task);
        });
      }
    }

    return tasks;
  }

  private generateTaskDescription(originalTask: string, agent: CrewAIAgent): string {
    const roleSpecificInstructions: Record<string, string> = {
      'Senior Research Analyst': `Research and analyze the following request with step-by-step reasoning: ${originalTask}. 
        Please structure your analysis as follows:
        1. Problem Understanding - What is the core question?
        2. Information Gathering - What do we know and need?
        3. Analysis Process - Walk through your analytical approach
        4. Findings - Present results with supporting evidence
        5. Conclusions - Summarize with confidence levels`,

      'Strategic Task Planner': `Develop a comprehensive strategy for: ${originalTask}.
        Show your strategic thinking process:
        1. Situation Analysis - Current state and constraints
        2. Goal Clarification - Define success criteria
        3. Option Generation - Consider multiple approaches
        4. Risk Assessment - Evaluate potential challenges
        5. Resource Planning - Identify needed resources
        6. Implementation Roadmap - Step-by-step plan`,

      'Web3 Operations Specialist': `Execute blockchain operations for: ${originalTask}.
        Follow security-first reasoning:
        1. Operation Analysis - Understand required transactions
        2. Security Review - Identify risks and mitigations
        3. Gas Optimization - Plan for efficient execution
        4. Transaction Preparation - Structure operations
        5. Execution - Perform with monitoring
        6. Verification - Confirm successful completion`,

      'Reasoning Quality Validator': `Review and validate the reasoning quality for: ${originalTask}.
        Apply systematic validation:
        1. Logic Review - Check reasoning consistency
        2. Evidence Assessment - Evaluate supporting data
        3. Gap Analysis - Identify missing elements
        4. Quality Scoring - Rate reasoning quality
        5. Improvement Suggestions - Recommend enhancements`
    };

    return roleSpecificInstructions[agent.role] || 
           `As a ${agent.role}, process the following task with clear reasoning steps: ${originalTask}`;
  }

  private generateExpectedOutput(agent: CrewAIAgent): string {
    const outputTemplates = {
      'analytical': 'Comprehensive analysis with visible reasoning chain, evidence evaluation, and confidence-rated conclusions',
      'strategic': 'Strategic plan with decision rationale, risk assessment, and implementation roadmap',
      'creative': 'Creative solution with ideation process, option evaluation, and innovation justification',
      'collaborative': 'Collaborative synthesis with stakeholder considerations and consensus-building approach'
    };

    return outputTemplates[agent.reasoningStyle] || 'Detailed output with clear reasoning and supporting evidence';
  }

  private async startReasoningChain(message: AgentMessage): Promise<AgentMessage> {
    const { taskId, agentId, initialObservation } = message.payload;
    
    const reasoningChainId = uuidv4();
    const initialStep: ChainOfThoughtStep = {
      stepNumber: 1,
      type: 'observation',
      content: initialObservation,
      reasoning: 'Starting reasoning process for assigned task',
      confidence: 0.9,
      timestamp: new Date().toISOString(),
      agentId
    };

    this.activeReasoningChains.set(reasoningChainId, [initialStep]);

    return {
      type: 'reasoning_chain_started',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        reasoningChainId,
        taskId,
        agentId,
        initialStep
      }
    };
  }

  private async handleReasoningStep(message: AgentMessage): Promise<AgentMessage> {
    const { reasoningChainId, step } = message.payload;
    
    const chain = this.activeReasoningChains.get(reasoningChainId);
    if (!chain) {
      throw new Error(`Reasoning chain ${reasoningChainId} not found`);
    }

    chain.push(step);
    this.logActivity('Reasoning step added', { 
      chainId: reasoningChainId, 
      stepNumber: step.stepNumber,
      type: step.type 
    });

    // Check if reasoning should continue or conclude
    const shouldContinue = this.evaluateReasoningContinuation(chain);
    
    return {
      type: shouldContinue ? 'reasoning_continue' : 'reasoning_complete',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        reasoningChainId,
        currentStep: step,
        chainLength: chain.length,
        shouldContinue,
        reasoningQuality: this.assessReasoningQuality(chain)
      }
    };
  }

  private evaluateReasoningContinuation(chain: ChainOfThoughtStep[]): boolean {
    // Continue reasoning if:
    // 1. Chain is short (less than 5 steps)
    // 2. Latest steps show uncertainty (confidence < 0.7)
    // 3. No clear conclusion reached
    
    if (chain.length < 3) return true;
    
    const recentSteps = chain.slice(-3);
    const avgConfidence = recentSteps.reduce((sum, step) => sum + step.confidence, 0) / recentSteps.length;
    
    if (avgConfidence < 0.7) return true;
    
    const hasConclusion = recentSteps.some(step => 
      step.type === 'reflection' && step.content.toLowerCase().includes('conclusion')
    );
    
    return !hasConclusion && chain.length < 10;
  }

  private assessReasoningQuality(chain: ChainOfThoughtStep[]): {
    score: number;
    strengths: string[];
    improvements: string[];
  } {
    let score = 0.5; // Base score
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Check for balanced step types
    const stepTypes = chain.map(s => s.type);
    const hasObservation = stepTypes.includes('observation');
    const hasThought = stepTypes.includes('thought');
    const hasAction = stepTypes.includes('action');
    const hasReflection = stepTypes.includes('reflection');

    if (hasObservation && hasThought) {
      score += 0.2;
      strengths.push('Balanced observation and thinking');
    }
    
    if (hasAction) {
      score += 0.1;
      strengths.push('Includes actionable steps');
    }
    
    if (hasReflection) {
      score += 0.15;
      strengths.push('Includes self-reflection');
    }

    // Check confidence progression
    const confidences = chain.map(s => s.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    if (avgConfidence > 0.8) {
      score += 0.1;
      strengths.push('High confidence in reasoning');
    } else if (avgConfidence < 0.5) {
      improvements.push('Increase reasoning confidence with more evidence');
    }

    // Check reasoning depth
    const avgReasoningLength = chain.reduce((sum, step) => sum + step.reasoning.length, 0) / chain.length;
    if (avgReasoningLength > 100) {
      score += 0.1;
      strengths.push('Detailed reasoning explanations');
    } else {
      improvements.push('Provide more detailed reasoning explanations');
    }

    return {
      score: Math.min(1.0, score),
      strengths,
      improvements
    };
  }

  private async getCrewStatus(message: AgentMessage): Promise<AgentMessage> {
    const activeChains = Array.from(this.activeReasoningChains.entries()).map(([id, chain]) => ({
      id,
      steps: chain.length,
      latestStep: chain[chain.length - 1],
      quality: this.assessReasoningQuality(chain)
    }));

    return {
      type: 'crew_status_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        totalCrews: this.crews.size,
        activeReasoningChains: activeChains.length,
        registeredAgents: this.agentRoles.size,
        chainDetails: activeChains
      }
    };
  }

  private estimateCompletionTime(tasks: CrewAITask[]): string {
    // Simple estimation based on task count and complexity
    const baseMinutes = tasks.length * 2;
    const complexityMultiplier = tasks.some(t => t.dependencies && t.dependencies.length > 0) ? 1.5 : 1;
    const estimated = Math.round(baseMinutes * complexityMultiplier);
    
    return `${estimated} minutes`;
  }

  getCapabilities(): string[] {
    return [
      'crew-orchestration',
      'chain-of-thought-reasoning',
      'task-delegation',
      'reasoning-validation',
      'multi-agent-coordination',
      'workflow-optimization'
    ];
  }
}