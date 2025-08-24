// Enhanced Task Orchestrator Agent - Intelligent task delegation with Agent2Agent protocol inspiration
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage, Task } from '../types/AgentTypes';
import { SystemPrompts } from '../prompts/SystemPrompts';
import { TaskTracker } from '../trackers/TaskTracker';
import { IntelligentAgentSelector, AgentSelectionRequest, AgentSelectionResult } from '../core/IntelligentAgentSelector';
import { CollaborativePlanner, CollaborationPlan } from '../core/CollaborativePlanner';
import { ChainOfThoughtEngine } from '../crewai/ChainOfThoughtEngine';
// Removed import - CapabilityMapper not needed for intelligent routing
import { v4 as uuidv4 } from 'uuid';

interface TaskQueue {
  high: Task[];
  medium: Task[];
  low: Task[];
}

export class TaskOrchestrator extends BaseAgent {
  private taskQueue: TaskQueue = { high: [], medium: [], low: [] };
  private activeTasks: Map<string, Task> = new Map();
  private mcpAgents: Map<string, string> = new Map();
  private intelligentSelector: IntelligentAgentSelector;
  private collaborativePlanner: CollaborativePlanner;
  private chainOfThought: ChainOfThoughtEngine;
  private activePlans: Map<string, CollaborationPlan> = new Map();

  constructor(messageBroker: MessageBroker, private taskTracker: TaskTracker) {
    super('task-orchestrator', messageBroker);
    this.intelligentSelector = new IntelligentAgentSelector();
    this.collaborativePlanner = new CollaborativePlanner(this.intelligentSelector);
    this.chainOfThought = new ChainOfThoughtEngine();
  }

  protected initialize(): void {
    this.logActivity('Initializing Task Orchestrator');
    
    // Reset to ensure clean state
    this.taskQueue = { high: [], medium: [], low: [] };
    this.activeTasks = new Map();
    this.mcpAgents = new Map();
    
    // Subscribe to task assignments
    this.messageBroker.subscribe('task_assignment', async (message: AgentMessage) => {
      await this.handleMessage(message);
    });

    // Subscribe to task completion updates
    this.messageBroker.subscribe('task_step_complete', async (message: AgentMessage) => {
      await this.handleStepCompletion(message);
    });

    // Subscribe to Nebula task completion updates
    this.messageBroker.subscribe('nebula_task_complete', async (message: AgentMessage) => {
      await this.handleStepCompletion(message);
    });

    // Subscribe to Nebula task error updates
    this.messageBroker.subscribe('nebula_task_error', async (message: AgentMessage) => {
      const { taskId, error } = message.payload;
      const task = this.activeTasks.get(taskId);
      if (task) {
        await this.handleTaskError(task, new Error(error));
      }
    });

    // Initialize MCP agent mappings
    this.initializeMCPMappings();

    // Start task processing loop
    this.startTaskProcessor();
  }

  getCapabilities(): string[] {
    return [
      'task_orchestration',
      'priority_management', 
      'mcp_coordination',
      'workflow_execution',
      'resource_allocation',
      'multi_task_coordination',
      'parallel_execution',
      'dependency_management'
    ];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      this.logActivity('Handling message', { type: message.type });

      // Handle task analysis from companion handler
      if (message.type === 'analyze_task') {
        const userMessage = message.payload.message;
        const userId = message.payload.userId;
        
        console.log('[TaskOrchestrator] Processing analyze_task:', { userMessage, userId, fullPayload: message.payload });
        
        // Create a task based on the user intent
        const taskType = this.determineTaskType(userMessage);
        const task: Task = {
          id: uuidv4(),
          userId: userId,
          type: taskType,
          category: taskType, // Set category to match type for MCP routing
          status: 'PENDING',
          priority: this.determinePriority(userMessage),
          description: userMessage,
          steps: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            originalMessage: userMessage,
            companionContext: message.payload.context
          }
        };
        
        console.log('[TaskOrchestrator] Task created:', { taskId: task.id, userId: task.userId, taskType: task.type });

        this.logActivity('Creating task from user message', { 
          taskId: task.id, 
          type: task.type, 
          priority: task.priority 
        });

        // Register with task tracker for proper monitoring
        await this.taskTracker.registerTask(task);

        // Add to appropriate queue
        this.addTaskToQueue(task);
        
        // Immediately process if it's a simple query like balance check
        if (task.type === 'balance_check' || task.type === 'token_info') {
          await this.processTask(task);
        }
        
        return {
          type: 'task_created',
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          senderId: this.agentId,
          targetId: message.senderId,
          payload: {
            taskId: task.id,
            taskType: task.type,
            message: 'Task created and processing...'
          }
        };
      }

      // Handle multi-task analysis results from PromptEngineer
      if (message.type === 'multi_task_analysis') {
        return await this.processMultiTaskAnalysis(message);
      }

      if (message.type === 'task_assignment') {
        return await this.processTaskAssignment(message);
      }

      return null;
    } catch (error) {
      console.error('[TaskOrchestrator] Error handling message:', error);
      return this.createErrorResponse(message, 'Failed to process task assignment');
    }
  }

  private async processTaskAssignment(message: AgentMessage): Promise<AgentMessage> {
    const { taskId, userId, category, parameters, priority } = message.payload;
    
    // Create task object
    const task: Task = {
      id: taskId,
      userId,
      category,
      title: this.generateTaskTitle(category, parameters),
      description: this.generateTaskDescription(category, parameters),
      parameters,
      state: 'NEW',
      priority: priority || 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    // Register with task tracker
    await this.taskTracker.registerTask(task);

    // Analyze task feasibility
    const analysisMessage: AgentMessage = {
      type: 'analyze_task',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'task-analyzer',
      payload: {
        taskId: task.id,
        category: task.category,
        parameters: task.parameters,
        priority: task.priority
      }
    };

    // Send for analysis (this would be handled by message broker routing)
    await this.sendMessage(analysisMessage);

    // Update task state
    task.state = 'ANALYZING';
    await this.taskTracker.updateTaskState(taskId, 'ANALYZING');

    // Queue task for execution (analysis would normally happen first)
    this.queueTask(task);

    const responseMessage: AgentMessage = {
      type: 'task_queued',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: message.senderId,
      payload: {
        taskId: task.id,
        queuePosition: this.getQueuePosition(task),
        estimatedStartTime: this.estimateStartTime(task)
      }
    };

    await this.sendMessage(responseMessage);
    return responseMessage;
  }

  private queueTask(task: Task): void {
    // Ensure taskQueue is properly initialized
    if (!this.taskQueue) {
      this.taskQueue = { high: [], medium: [], low: [] };
    }
    
    // Validate priority is a valid key
    const validPriorities = ['high', 'medium', 'low'] as const;
    if (!validPriorities.includes(task.priority as any)) {
      console.warn(`[TaskOrchestrator] Invalid priority: ${task.priority}, defaulting to medium`);
      task.priority = 'medium';
    }
    
    // Ensure the priority queue exists
    if (!this.taskQueue[task.priority]) {
      this.taskQueue[task.priority] = [];
    }
    
    this.taskQueue[task.priority].push(task);
    this.logActivity('Task queued', { taskId: task.id, priority: task.priority });
  }

  private startTaskProcessor(): void {
    // Process tasks every 5 seconds
    setInterval(async () => {
      await this.processNextTask();
    }, 5000);
  }

  private async processNextTask(): Promise<void> {
    try {
      // Get next task from queue (prioritize high > medium > low)
      const nextTask = this.getNextTask();
      if (!nextTask) return;

      // Check if we can start more tasks
      if (this.activeTasks.size >= 5) { // Max 5 concurrent tasks
        return;
      }

      // Remove from queue and add to active tasks
      this.removeFromQueue(nextTask);
      this.activeTasks.set(nextTask.id, nextTask);

      // Update task state
      nextTask.state = 'RUNNING';
      nextTask.startedAt = new Date();
      await this.taskTracker.updateTaskState(nextTask.id, 'RUNNING');

      // Execute task
      await this.executeTask(nextTask);

    } catch (error) {
      console.error('[TaskOrchestrator] Error processing task:', error);
    }
  }

  private getNextTask(): Task | null {
    // Ensure taskQueue is initialized
    if (!this.taskQueue) {
      return null;
    }
    
    // Prioritize: high > medium > low
    if (this.taskQueue.high && this.taskQueue.high.length > 0) {
      return this.taskQueue.high[0];
    }
    if (this.taskQueue.medium && this.taskQueue.medium.length > 0) {
      return this.taskQueue.medium[0];
    }
    if (this.taskQueue.low && this.taskQueue.low.length > 0) {
      return this.taskQueue.low[0];
    }
    return null;
  }

  private removeFromQueue(task: Task): void {
    if (!this.taskQueue) return;
    
    const priority = task.priority as keyof TaskQueue;
    const queue = this.taskQueue[priority];
    if (!queue) return;
    
    const index = queue.findIndex(t => t.id === task.id);
    if (index >= 0) {
      queue.splice(index, 1);
    }
  }

  private async executeTask(task: Task): Promise<void> {
    try {
      this.logActivity('Executing task with intelligent delegation', { taskId: task.id, category: task.category });

      // Check if this is a complex task requiring collaboration
      const isComplex = await this.isComplexTask(task);
      
      if (isComplex) {
        await this.executeCollaborativeTask(task);
      } else {
        await this.executeSingleAgentTask(task);
      }

    } catch (error) {
      console.error(`[TaskOrchestrator] Error executing task ${task.id}:`, error);
      await this.handleTaskError(task, error as Error);
    }
  }

  // Execute tasks requiring multiple agents with collaboration
  private async executeCollaborativeTask(task: Task): Promise<void> {
    console.log(`[TaskOrchestrator] Executing collaborative task ${task.id}`);

    // Create collaboration plan
    const plan = await this.collaborativePlanner.createCollaborationPlan(task, {
      originalMessage: task.description,
      userId: task.userId,
      priority: task.priority
    });

    this.activePlans.set(task.id!, plan);

    // Execute plan steps
    await this.executePlanSteps(plan);
  }

  // Execute simple tasks with single agent using AI-powered intelligent selection
  private async executeSingleAgentTask(task: Task): Promise<void> {
    console.log(`[TaskOrchestrator] Executing single-agent task ${task.id} with intelligent AI selection`);

    // Create agent selection request
    const selectionRequest: AgentSelectionRequest = {
      taskDescription: task.description,
      taskType: task.type || 'general',
      priority: task.priority,
      context: {
        originalMessage: task.description,
        userId: task.userId,
        taskId: task.id
      },
      userId: task.userId
    };

    // Use AI-powered intelligent agent selection
    const selectionResult = await this.intelligentSelector.selectBestAgent(selectionRequest);
    
    if (!selectionResult.primaryAgent) {
      throw new Error(`No suitable agents found for task: ${task.description}`);
    }

    const selectedAgent = selectionResult.primaryAgent;

    // Generate chain of thought for task execution
    const reasoning = await this.generateExecutionChainOfThought(task, {
      agentId: selectedAgent.agentId,
      agentName: selectedAgent.agentName,
      confidence: selectedAgent.confidence,
      reasoning: selectedAgent.reasoning
    });
    
    console.log(`[TaskOrchestrator] AI selected agent ${selectedAgent.agentId} for task ${task.id}`, {
      confidence: selectedAgent.confidence,
      reasoning: selectedAgent.reasoning,
      taskAnalysis: selectionResult.taskAnalysis,
      chainOfThought: reasoning
    });

    // Create and send execution message using intelligent routing
    await this.sendTaskToIntelligentAgent(task, selectionResult);

    // Update agent performance metrics
    this.updateIntelligentAgentMetrics(selectedAgent.agentId, task.type || 'general', true);
  }

  private async executePlanSteps(plan: CollaborationPlan): Promise<void> {
    console.log(`[TaskOrchestrator] Executing collaboration plan ${plan.planId} with ${plan.executionSteps.length} steps`);

    // Execute parallel steps first
    const parallelSteps = plan.executionSteps.filter(step => step.parallel);
    const sequentialSteps = plan.executionSteps.filter(step => !step.parallel);

    // Execute parallel steps simultaneously
    if (parallelSteps.length > 0) {
      const parallelPromises = parallelSteps.map(step => this.executeStep(step, plan));
      await Promise.all(parallelPromises);
    }

    // Execute sequential steps in order
    for (const step of sequentialSteps) {
      await this.executeStep(step, plan);
    }
  }

  private async executeStep(step: any, plan: CollaborationPlan): Promise<void> {
    console.log(`[TaskOrchestrator] Executing step ${step.stepId} with agent ${step.agentId}`);

    const executionMessage: AgentMessage = {
      type: this.getMessageTypeForCapability(step.capability),
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: step.agentId,
      payload: {
        ...step.inputs,
        stepId: step.stepId,
        planId: plan.planId,
        capability: step.capability
      }
    };

    await this.sendMessage(executionMessage);
  }

  private async sendTaskToAgent(task: Task, selectedAgent: any): Promise<void> {
    const messageType = this.getMessageTypeForAgent(selectedAgent.agentId, selectedAgent.capability.capabilityName);
    
    // Prepare parameters with intelligent wallet address injection for blockchain operations
    let enhancedParameters = task.parameters || {};
    
    // For blockchain operations, inject wallet address into parameters
    if (this.isBlockchainOperation(selectedAgent.capability.capabilityName, task.type)) {
      const walletAddress = task.userId && task.userId.startsWith('0x') ? task.userId : undefined;
      
      if (walletAddress) {
        enhancedParameters = {
          ...enhancedParameters,
          address: walletAddress,
          walletAddress: walletAddress
        };
        console.log(`🔗 [TaskOrchestrator] Injected wallet address for blockchain operation: ${walletAddress}`);
      } else {
        console.warn(`⚠️ [TaskOrchestrator] No valid wallet address found for blockchain operation. userId: ${task.userId}`);
      }
    }
    
    const executionMessage: AgentMessage = {
      type: messageType,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: selectedAgent.agentId,
      payload: {
        taskId: task.id,
        type: task.type || task.category,
        category: task.category || task.type,
        parameters: enhancedParameters,
        userId: task.userId,
        description: task.description,
        walletAddress: task.userId && task.userId.startsWith('0x') ? task.userId : undefined,
        capability: selectedAgent.capability.capabilityName,
        reasoning: selectedAgent.reasoning
      }
    };

    await this.sendMessage(executionMessage);
  }

  // Enhanced chain of thought generation for task execution with intelligent agent selection
  private async generateExecutionChainOfThought(task: Task, selectedAgent: any): Promise<string[]> {
    const reasoning: string[] = [];

    reasoning.push(`Task Analysis: ${task.description}`);
    reasoning.push(`Task Type: ${task.type}, Priority: ${task.priority}`);
    
    // Handle both old and new agent format
    if (selectedAgent.confidence !== undefined) {
      // New intelligent agent format
      reasoning.push(`AI Selected Agent: ${selectedAgent.agentId} (confidence: ${(selectedAgent.confidence * 100).toFixed(1)}%)`);
      reasoning.push(`Selection Reasoning: ${selectedAgent.reasoning.join(', ')}`);
    } else {
      // Legacy format fallback
      reasoning.push(`Selected Agent: ${selectedAgent.agentId} (score: ${selectedAgent.score?.toFixed(2) || 'N/A'})`);
      reasoning.push(`Agent Reasoning: ${selectedAgent.reasoning || 'Legacy selection'}`);
    }
    
    // Add agent configuration details if available
    const agentConfig = this.intelligentSelector.getAgentConfig(selectedAgent.agentId);
    if (agentConfig) {
      reasoning.push(`Agent Type: ${agentConfig.type}, Role: ${agentConfig.role}`);
      reasoning.push(`Success Rate: ${(agentConfig.successRate * 100).toFixed(1)}%`);
      reasoning.push(`Average Latency: ${agentConfig.averageLatency}ms`);
    }

    return reasoning;
  }

  // Send task to intelligently selected agent
  private async sendTaskToIntelligentAgent(task: Task, selectionResult: AgentSelectionResult): Promise<void> {
    const selectedAgent = selectionResult.primaryAgent;
    const messageType = this.getMessageTypeForIntelligentAgent(selectedAgent.agentId, selectionResult.taskAnalysis.category);
    
    // Prepare parameters with intelligent wallet address injection for blockchain operations
    let enhancedParameters = task.parameters || {};
    
    // For blockchain operations, inject wallet address into parameters
    if (this.isBlockchainOperation(selectionResult.taskAnalysis.category, task.type)) {
      const walletAddress = task.userId && task.userId.startsWith('0x') ? task.userId : undefined;
      
      if (walletAddress) {
        enhancedParameters = {
          ...enhancedParameters,
          address: walletAddress,
          walletAddress: walletAddress
        };
        console.log(`🔗 [TaskOrchestrator] Injected wallet address for blockchain operation: ${walletAddress}`);
      } else {
        console.warn(`⚠️ [TaskOrchestrator] No valid wallet address found for blockchain operation. userId: ${task.userId}`);
      }
    }
    
    const executionMessage: AgentMessage = {
      type: messageType,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: selectedAgent.agentId,
      payload: {
        taskId: task.id,
        type: task.type || task.category,
        category: task.category || task.type,
        parameters: enhancedParameters,
        userId: task.userId,
        description: task.description,
        walletAddress: task.userId && task.userId.startsWith('0x') ? task.userId : undefined,
        selectionConfidence: selectedAgent.confidence,
        selectionReasoning: selectedAgent.reasoning,
        taskAnalysis: selectionResult.taskAnalysis
      }
    };

    await this.sendMessage(executionMessage);
  }

  // Get message type for intelligently selected agent
  private getMessageTypeForIntelligentAgent(agentId: string, taskCategory: string): string {
    // Map agent types to appropriate message types
    switch (agentId) {
      case 'blockchain-agent':
        return 'blockchain_operation';
      case 'research-agent':
        return 'research_request';
      case 'code-generation-agent':
        return 'code_generation_request';
      case 'goat-mcp':
        return 'mcp_request';
      case 'nebula-mcp':
        return 'nebula_request';
      default:
        // Fallback to category-based mapping
        return this.getMessageTypeForCategory(taskCategory);
    }
  }

  // Get message type for category mapping
  private getMessageTypeForCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      // Blockchain operations
      'contract_deployment': 'blockchain_operation',
      'token_transfer': 'blockchain_operation', 
      'account_query': 'blockchain_operation',
      'balance_check': 'blockchain_operation',
      'token_info': 'blockchain_operation',
      'nft_mint': 'blockchain_operation',
      'nft_operations': 'blockchain_operation',
      
      // Research operations
      'research': 'research_request',
      'analysis': 'research_request',
      'market_research': 'research_request',
      
      // Code operations
      'code_generation': 'code_generation_request',
      'coding': 'code_generation_request',
      'development': 'code_generation_request',
      
      // MCP operations
      'mcp_request': 'mcp_request',
      'nebula_request': 'nebula_request',
      
      // Default fallback
      'general': 'execute_task'
    };
    
    return categoryMap[category] || 'execute_task';
  }

  // Update metrics for intelligently selected agent
  private updateIntelligentAgentMetrics(agentId: string, taskType: string, success: boolean): void {
    // Log the performance for future learning
    console.log(`[TaskOrchestrator] Agent performance update: ${agentId}, task: ${taskType}, success: ${success}`);
    
    // In the future, this could update a learning database for improving agent selection
    // For now, we just log for monitoring purposes
  }

  // Helper methods for intelligent delegation
  private async isComplexTask(task: Task): Promise<boolean> {
    // Only truly collaborative multi-agent tasks should be complex
    const complexTaskTypes = ['multi_agent_workflow', 'batch_operations_cross_platform', 'complex_research_with_coding'];
    const hasMultipleDistinctSteps = task.description?.includes(' and then ') || 
                                   task.description?.includes(' followed by ') ||
                                   (task.description?.includes(' and ') && task.description?.includes(' also '));
    
    // ERC20 deployment, NFT operations, balance checks etc. are single-agent blockchain operations
    const blockchainTaskTypes = ['erc20_deployment', 'contract_deployment', 'nft_mint', 'balance_check', 'token_transfer'];
    if (blockchainTaskTypes.includes(task.type || '')) {
      return false; // These should go to BlockchainAgent directly
    }
    
    return complexTaskTypes.includes(task.type || '') || hasMultipleDistinctSteps || false;
  }

  private determineSecurityLevel(task: Task): 'low' | 'medium' | 'high' {
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
      // Blockchain operations - route to BlockchainAgent
      'erc20_deployment': ['erc20_deployment', 'blockchain_operations'],
      'contract_deployment': ['contract_deployment', 'smart_contract_development'],
      'nft_mint': ['nft_operations', 'blockchain_operations'],
      'balance_check': ['blockchain_operations'],
      'token_transfer': ['blockchain_operations'],
      'defi_operation': ['blockchain_operations'],
      
      // Research operations - route to ResearchAgent
      'market_research': ['market_research'],
      'competitor_analysis': ['competitor_analysis'],
      'trend_analysis': ['trend_analysis'],
      'research_analysis': ['market_research', 'trend_analysis'],
      
      // Code generation - route to CodeGenerationAgent
      'code_generation': ['frontend_development', 'api_development'],
      'smart_contract_development': ['smart_contract_development'],
      'frontend_development': ['frontend_development'],
      'api_development': ['api_development'],
      'testing_automation': ['testing_automation'],
      
      // Conversation - route to CompanionHandler
      'conversation': ['conversation'],
      'general_query': ['conversation'],
      'task_detection': ['task_detection']
    };
    return mapping[taskType] || ['conversation'];
  }

  // Helper method to determine if an operation is blockchain-related
  private isBlockchainOperation(capability: string, taskType?: string): boolean {
    const blockchainCapabilities = ['blockchain_operations', 'erc20_deployment', 'nft_operations', 'contract_deployment'];
    const blockchainTaskTypes = ['balance_check', 'token_transfer', 'nft_mint', 'contract_deployment', 'erc20_deployment'];
    
    return blockchainCapabilities.includes(capability) || 
           (taskType !== undefined && blockchainTaskTypes.includes(taskType));
  }

  private getMessageTypeForAgent(agentId: string, capability: string): string {
    // Map agent and capability to appropriate message type for CrewAI agents
    if (agentId === 'blockchain-agent') {
      return 'blockchain_operation';
    } else if (agentId === 'research-agent') {
      return 'research_request';
    } else if (agentId === 'code-generation-agent') {
      return 'code_request';
    } else if (agentId === 'nebula-mcp') {
      return 'execute_nebula_task';
    } else if (agentId === 'goat-mcp') {
      if (capability === 'balance_check') return 'check_balance';
      if (capability === 'token_transfer') return 'transfer_token';
      return 'execute_task';
    }
    return 'execute_task';
  }

  private getMessageTypeForCapability(capability: string): string {
    const mapping: Record<string, string> = {
      // Blockchain operations
      'erc20_deployment': 'blockchain_operation',
      'blockchain_operations': 'blockchain_operation',
      'contract_deployment': 'blockchain_operation',
      'nft_operations': 'blockchain_operation',
      
      // Research operations
      'market_research': 'research_request',
      'competitor_analysis': 'research_request',
      'trend_analysis': 'research_request',
      
      // Code generation operations
      'smart_contract_development': 'code_request',
      'frontend_development': 'code_request',
      'api_development': 'code_request',
      'testing_automation': 'code_request',
      
      // Legacy operations
      'nft_mint': 'execute_nebula_task',
      'balance_check': 'check_balance',
      'token_transfer': 'transfer_token',
      'conversation': 'handle_conversation',
      'task_detection': 'detect_task'
    };
    return mapping[capability] || 'execute_task';
  }

  private updateAgentLoad(agentId: string, capability: string, increased: boolean): void {
    const loadDelta = increased ? 0.1 : -0.1;
    // Update capability registry with new load information
    // This would be expanded to track real agent performance metrics
    console.log(`[TaskOrchestrator] Updated load for ${agentId}:${capability} by ${loadDelta}`);
  }

  private async handleStepCompletion(message: AgentMessage): Promise<void> {
    const { taskId, success, result, error } = message.payload;
    const task = this.activeTasks.get(taskId);
    
    if (!task) {
      console.warn(`[TaskOrchestrator] Received completion for unknown task: ${taskId}`);
      return;
    }

    // For nebula_task_complete, success is implicitly true
    const isSuccess = success === true || (message.type === 'nebula_task_complete' && success !== false);
    
    if (isSuccess) {
      // Task completed successfully
      task.state = 'COMPLETED';
      task.completedAt = new Date();
      task.result = result;
      
      await this.taskTracker.updateTaskState(taskId, 'COMPLETED', result);
      this.activeTasks.delete(taskId);

      // Notify completion
      await this.notifyTaskCompletion(task, result);
      
      this.logActivity('Task completed successfully', { taskId, result });
    } else {
      // Task failed
      await this.handleTaskError(task, new Error(error || 'Task execution failed'));
    }
  }

  private async handleTaskError(task: Task, error: Error): Promise<void> {
    task.retryCount = (task.retryCount || 0) + 1;
    task.error = error.message;

    if (task.retryCount < (task.maxRetries || 3)) {
      // Retry task
      task.state = 'QUEUED';
      this.queueTask(task);
      this.activeTasks.delete(task.id);
      
      await this.taskTracker.updateTaskState(task.id, 'QUEUED', null, error.message);
      this.logActivity('Task queued for retry', { taskId: task.id, attempt: task.retryCount });
    } else {
      // Mark as failed
      task.state = 'FAILED';
      task.completedAt = new Date();
      
      await this.taskTracker.updateTaskState(task.id, 'FAILED', null, error.message);
      this.activeTasks.delete(task.id);

      // Notify failure
      await this.notifyTaskFailure(task, error);
      
      this.logActivity('Task failed', { taskId: task.id, error: error.message });
    }
  }

  private async notifyTaskCompletion(task: Task, result: any): Promise<void> {
    const notificationMessage: AgentMessage = {
      type: 'task_complete',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'companion-handler',
      payload: {
        taskId: task.id,
        userId: task.userId,
        result,
        task
      }
    };

    // Also broadcast task result for the orchestrator to pick up
    const resultMessage: AgentMessage = {
      type: 'task_result',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'broadcast',
      payload: {
        taskId: task.id,
        result: typeof result === 'string' ? result : JSON.stringify(result),
        success: true
      }
    };

    await this.sendMessage(notificationMessage);
    await this.sendMessage(resultMessage);
  }

  private async notifyTaskFailure(task: Task, error: Error): Promise<void> {
    const notificationMessage: AgentMessage = {
      type: 'task_failed',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'companion-handler',
      payload: {
        taskId: task.id,
        userId: task.userId,
        error: error.message,
        task
      }
    };

    await this.sendMessage(notificationMessage);
  }

  private async processMultiTaskAnalysis(message: AgentMessage): Promise<AgentMessage> {
    const { tasks, executionOrder, dependencies, totalEstimatedDuration, overallPriority } = message.payload;
    const userId = message.payload.context?.userId || 'unknown';
    
    this.logActivity('Processing multi-task analysis', {
      taskCount: tasks.length,
      executionOrder,
      dependencyCount: dependencies.length,
      overallPriority
    });

    // Create individual Task objects for each intent
    const createdTasks: Task[] = [];
    for (const taskIntent of tasks) {
      const task: Task = {
        id: uuidv4(),
        userId: userId,
        type: taskIntent.category,
        status: 'PENDING',
        priority: taskIntent.priority,
        description: taskIntent.textSegment,
        steps: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          originalMessage: taskIntent.textSegment,
          multiTaskGroup: message.id,
          canExecuteInParallel: taskIntent.canExecuteInParallel,
          dependencies: dependencies.filter((dep: any) => dep.taskId === taskIntent.id)
        }
      };
      
      createdTasks.push(task);
      this.addTaskToQueue(task);
    }

    // Execute based on strategy
    if (executionOrder === 'parallel') {
      // Execute all tasks in parallel
      this.logActivity('Executing tasks in parallel', { taskCount: createdTasks.length });
      const parallelPromises = createdTasks.map(task => this.processTask(task));
      await Promise.allSettled(parallelPromises);
    } else if (executionOrder === 'sequential') {
      // Execute tasks one by one
      this.logActivity('Executing tasks sequentially', { taskCount: createdTasks.length });
      for (const task of createdTasks) {
        await this.processTask(task);
      }
    } else {
      // Mixed execution: respect dependencies
      this.logActivity('Executing tasks with dependency management', { taskCount: createdTasks.length });
      await this.executeWithDependencies(createdTasks, dependencies);
    }

    return {
      type: 'multi_task_processing_started',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: message.senderId,
      payload: {
        taskIds: createdTasks.map(t => t.id),
        executionOrder,
        totalEstimatedDuration,
        message: `Started processing ${createdTasks.length} tasks with ${executionOrder} execution...`
      }
    };
  }

  private async executeWithDependencies(tasks: Task[], dependencies: any[]): Promise<void> {
    const completed = new Set<string>();
    const inProgress = new Set<string>();
    
    while (completed.size < tasks.length) {
      // Find tasks that can be executed (no pending dependencies)
      const executable = tasks.filter(task => {
        if (completed.has(task.id) || inProgress.has(task.id)) return false;
        
        const taskDeps = dependencies.filter(dep => dep.taskId === task.id);
        return taskDeps.every(dep => 
          dep.dependsOn.every((depId: string) => completed.has(depId))
        );
      });

      if (executable.length === 0) {
        // No executable tasks - circular dependency or error
        this.logActivity('No executable tasks found - possible circular dependency', {
          remaining: tasks.length - completed.size,
          inProgress: inProgress.size
        });
        break;
      }

      // Execute all available tasks (some may run in parallel)
      const promises = executable.map(async (task) => {
        inProgress.add(task.id);
        try {
          await this.processTask(task);
          completed.add(task.id);
          inProgress.delete(task.id);
        } catch (error) {
          inProgress.delete(task.id);
          this.logActivity('Task failed during dependency execution', {
            taskId: task.id,
            error: error
          });
        }
      });

      await Promise.allSettled(promises);
    }
  }

  private getMCPForCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      // Goat MCP - Basic blockchain operations
      'contract_deployment': 'goat-mcp',
      'token_transfer': 'goat-mcp',
      'account_query': 'goat-mcp',
      'balance_check': 'goat-mcp', // Route balance checks to Goat MCP
      'token_info': 'goat-mcp',    // Route token info to Goat MCP
      'cross_chain': 'goat-mcp',
      'defi_operations': 'goat-mcp',
      
      // Nebula MCP - Advanced Thirdweb operations
      'nft_mint': 'nebula-mcp',
      'marketplace_list': 'nebula-mcp',
      'gasless_tx': 'nebula-mcp',
      'token_deploy': 'nebula-mcp',
      
      // Other MCP agents
      'information': 'research-mcp',
      'automation': 'scheduler-mcp',
      'documentation': 'docwriter-mcp',
      'code_generation': 'codegen-mcp'
    };

    return categoryMap[category] || 'goat-mcp';
  }

  private initializeMCPMappings(): void {
    this.mcpAgents.set('blockchain', 'goat-mcp');
    this.mcpAgents.set('research', 'research-mcp');
    this.mcpAgents.set('scheduling', 'scheduler-mcp');
    this.mcpAgents.set('documentation', 'docwriter-mcp');
    this.mcpAgents.set('coding', 'codegen-mcp');
  }

  private generateTaskTitle(category: string, parameters: Record<string, any>): string {
    const titleMap: Record<string, (params: Record<string, any>) => string> = {
      'contract_deployment': (p) => `Deploy ${p.contractType || 'Smart'} Contract`,
      'nft_operations': (p) => `Mint ${p.quantity || 1} NFT(s)`,
      'token_operations': (p) => `Transfer ${p.amount} ${p.token || 'Tokens'}`,
      'defi_operations': (p) => `DeFi Operation: ${p.operation || 'Unknown'}`,
      'information': (p) => `Information Request`,
      'automation': (p) => `Setup Automation`
    };

    const generator = titleMap[category];
    return generator ? generator(parameters) : `Execute ${category}`;
  }

  private generateTaskDescription(category: string, parameters: Record<string, any>): string {
    const descMap: Record<string, (params: Record<string, any>) => string> = {
      'contract_deployment': (p) => `Deploy ${p.contractType} contract with name "${p.name}" to Base Camp testnet`,
      'nft_operations': (p) => `Mint ${p.quantity || 1} NFT(s) to ${p.recipient || 'user wallet'}`,
      'token_operations': (p) => `Transfer ${p.amount} ${p.token} tokens to ${p.recipient}`,
      'defi_operations': (p) => `Perform ${p.operation} operation with parameters`,
      'information': (p) => `Retrieve requested information`,
      'automation': (p) => `Configure automated task execution`
    };

    const generator = descMap[category];
    return generator ? generator(parameters) : `Execute ${category} operation`;
  }

  private getQueuePosition(task: Task): number {
    const queue = this.taskQueue[task.priority];
    return queue.findIndex(t => t.id === task.id) + 1;
  }

  private estimateStartTime(task: Task): string {
    const position = this.getQueuePosition(task);
    const avgTaskTime = 3; // 3 minutes average
    const estimatedMinutes = position * avgTaskTime;
    
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() + estimatedMinutes);
    
    return startTime.toISOString();
  }

  getQueueStatus(): { high: number; medium: number; low: number; active: number } {
    return {
      high: this.taskQueue.high.length,
      medium: this.taskQueue.medium.length,
      low: this.taskQueue.low.length,
      active: this.activeTasks.size
    };
  }

  private async processTask(task: Task): Promise<void> {
    // Add to active tasks for tracking
    this.activeTasks.set(task.id, task);
    
    try {
      // Update status to running
      task.status = 'RUNNING';
      task.updatedAt = new Date().toISOString();
      
      this.logActivity('Processing immediate task', { 
        taskId: task.id, 
        type: task.type,
        description: task.description 
      });

      // Execute the task through normal flow
      await this.executeTask(task);
      
    } catch (error) {
      console.error(`[TaskOrchestrator] Error processing immediate task ${task.id}:`, error);
      await this.handleTaskError(task, error as Error);
    }
  }

  private determineTaskType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // ERC20 Token Deployment (highest priority check)
    if ((lowerMessage.includes('deploy') || lowerMessage.includes('create') || lowerMessage.includes('launch')) && 
        (lowerMessage.includes('token') || lowerMessage.includes('erc20') || lowerMessage.includes('coin'))) {
      return 'erc20_deployment';
    }
    
    // Smart Contract Deployment
    if (lowerMessage.includes('deploy') && (lowerMessage.includes('contract') || lowerMessage.includes('smart contract'))) {
      return 'contract_deployment';
    }
    
    // Balance and token queries
    if (lowerMessage.includes('balance') || lowerMessage.includes('how much')) {
      return 'balance_check';
    }
    if (lowerMessage.includes('token') && (lowerMessage.includes('info') || lowerMessage.includes('price'))) {
      return 'token_info';
    }
    
    // NFT operations
    if (lowerMessage.includes('mint') && (lowerMessage.includes('nft') || lowerMessage.includes('random') || lowerMessage.includes('character') || lowerMessage.includes('companion'))) {
      return 'nft_mint';
    }
    
    // Transfer operations
    if (lowerMessage.includes('transfer') || lowerMessage.includes('send')) {
      return 'token_transfer';
    }
    
    return 'general_query';
  }

  private determinePriority(message: string): 'high' | 'medium' | 'low' {
    const lowerMessage = message.toLowerCase();
    
    // High priority: Balance checks, urgent queries
    if (lowerMessage.includes('balance') || lowerMessage.includes('urgent')) {
      return 'high';
    }
    
    // Medium priority: NFT operations, transfers
    if (lowerMessage.includes('nft') || lowerMessage.includes('transfer')) {
      return 'medium';
    }
    
    return 'low';
  }

  private addTaskToQueue(task: Task) {
    this.taskQueue[task.priority].push(task);
    this.logActivity('Added task to queue', { 
      taskId: task.id, 
      priority: task.priority,
      queueSize: this.taskQueue[task.priority].length 
    });
  }

  private createErrorResponse(originalMessage: AgentMessage, error: string): AgentMessage {
    return {
      type: 'error_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: originalMessage.senderId,
      payload: {
        error,
        originalMessageId: originalMessage.id
      }
    };
  }
}