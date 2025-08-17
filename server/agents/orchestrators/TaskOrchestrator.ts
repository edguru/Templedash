// Task Orchestrator Agent - Organizes tasks, prioritizes, and assigns them to MCPs
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage, Task } from '../types/AgentTypes';
import { TaskTracker } from '../trackers/TaskTracker';
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

  constructor(messageBroker: MessageBroker, private taskTracker: TaskTracker) {
    super('task-orchestrator', messageBroker);
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
      'resource_allocation'
    ];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      this.logActivity('Handling message', { type: message.type });

      // Handle task analysis from companion handler
      if (message.type === 'analyze_task') {
        const userMessage = message.payload.message;
        const userId = message.payload.userId;
        
        // Create a task based on the user intent
        const task: Task = {
          id: uuidv4(),
          userId: userId,
          type: this.determineTaskType(userMessage),
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

        this.logActivity('Creating task from user message', { 
          taskId: task.id, 
          type: task.type, 
          priority: task.priority 
        });

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
      this.logActivity('Executing task', { taskId: task.id, category: task.category });

      // Determine which MCP agent to use based on task type
      const mcpAgent = this.getMCPForCategory(task.type || task.category);
      
      // Create execution message with appropriate type for different MCPs
      let messageType = 'execute_task';
      if (mcpAgent === 'nebula-mcp') {
        messageType = 'execute_nebula_task';
      } else if (mcpAgent === 'goat-mcp' && (task.type === 'balance_check' || task.type === 'token_info')) {
        messageType = 'check_balance'; // Use specific balance check message type
      }
      
      const executionMessage: AgentMessage = {
        type: messageType,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: this.agentId,
        targetId: mcpAgent,
        payload: {
          taskId: task.id,
          type: task.type || task.category,
          category: task.category,
          parameters: task.parameters,
          userId: task.userId,
          description: task.description,
          walletAddress: task.userId // Pass userId as wallet address for balance checks
        }
      };

      // Send to appropriate MCP agent
      await this.sendMessage(executionMessage);

    } catch (error) {
      console.error(`[TaskOrchestrator] Error executing task ${task.id}:`, error);
      await this.handleTaskError(task, error as Error);
    }
  }

  private async handleStepCompletion(message: AgentMessage): Promise<void> {
    const { taskId, success, result, error } = message.payload;
    const task = this.activeTasks.get(taskId);
    
    if (!task) {
      console.warn(`[TaskOrchestrator] Received completion for unknown task: ${taskId}`);
      return;
    }

    if (success) {
      // Task completed successfully
      task.state = 'COMPLETED';
      task.completedAt = new Date();
      task.result = result;
      
      await this.taskTracker.updateTaskState(taskId, 'COMPLETED', result);
      this.activeTasks.delete(taskId);

      // Notify completion
      await this.notifyTaskCompletion(task, result);
      
      this.logActivity('Task completed', { taskId, result });
    } else {
      // Task failed
      await this.handleTaskError(task, new Error(error || 'Task execution failed'));
    }
  }

  private async handleTaskError(task: Task, error: Error): Promise<void> {
    task.retryCount++;
    task.error = error.message;

    if (task.retryCount < task.maxRetries) {
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
    
    // Balance and token queries
    if (lowerMessage.includes('balance') || lowerMessage.includes('how much')) {
      return 'balance_check';
    }
    if (lowerMessage.includes('token') && (lowerMessage.includes('info') || lowerMessage.includes('price'))) {
      return 'token_info';
    }
    
    // NFT operations
    if (lowerMessage.includes('mint') && lowerMessage.includes('nft')) {
      return 'nft_mint';
    }
    
    // Transfer operations
    if (lowerMessage.includes('transfer') || lowerMessage.includes('send')) {
      return 'token_transfer';
    }
    
    // Contract operations
    if (lowerMessage.includes('deploy') && lowerMessage.includes('contract')) {
      return 'contract_deploy';
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