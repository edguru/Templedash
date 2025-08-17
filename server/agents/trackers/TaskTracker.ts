// Task Tracker Agent - Monitors progress/status of all tasks
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage, Task, TaskState } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageCompletionTime: number;
  successRate: number;
}

export class TaskTracker extends BaseAgent {
  private tasks: Map<string, Task> = new Map();
  private userTasks: Map<string, string[]> = new Map();
  private taskHistory: Task[] = [];
  private metrics: TaskMetrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageCompletionTime: 0,
    successRate: 0
  };

  constructor(messageBroker: MessageBroker) {
    super('task-tracker', messageBroker);
  }

  protected initialize(): void {
    this.logActivity('Initializing Task Tracker');
    
    // Subscribe to task state updates
    this.messageBroker.subscribe('task_state_update', async (message: AgentMessage) => {
      await this.handleMessage(message);
    });

    // Subscribe to task status requests
    this.messageBroker.subscribe('get_task_status', async (message: AgentMessage) => {
      await this.handleMessage(message);
    });

    // Start periodic cleanup and metrics calculation
    this.startPeriodicTasks();
  }

  getCapabilities(): string[] {
    return [
      'task_monitoring',
      'progress_tracking',
      'status_reporting',
      'metrics_calculation',
      'task_history',
      'failure_analysis'
    ];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      this.logActivity('Handling message', { type: message.type });

      switch (message.type) {
        case 'get_task_status':
          return await this.getTaskStatus(message.payload.taskId);
          
        case 'task_state_update':
          await this.updateTaskState(
            message.payload.taskId,
            message.payload.state,
            message.payload.result,
            message.payload.error
          );
          break;

        case 'get_user_tasks':
          return await this.getUserTasks(message.payload.userId);
          
        case 'get_task_metrics':
          return await this.getMetrics(message.payload.userId);
      }

      return null;
    } catch (error) {
      console.error('[TaskTracker] Error handling message:', error);
      return this.createErrorResponse(message, 'Failed to process request');
    }
  }

  async registerTask(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
    
    // Track user tasks
    if (!this.userTasks.has(task.userId)) {
      this.userTasks.set(task.userId, []);
    }
    this.userTasks.get(task.userId)!.push(task.id);

    // Update metrics
    this.metrics.totalTasks++;
    
    this.logActivity('Task registered', { taskId: task.id, userId: task.userId });

    // Notify registration
    await this.notifyTaskRegistered(task);
  }

  async updateTaskState(
    taskId: string, 
    newState: TaskState, 
    result?: any, 
    error?: string
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[TaskTracker] Unknown task: ${taskId}`);
      return;
    }

    const oldState = task.state;
    task.state = newState;
    task.updatedAt = new Date();

    if (result) task.result = result;
    if (error) task.error = error;

    // Handle state-specific updates
    switch (newState) {
      case 'RUNNING':
        task.startedAt = new Date();
        break;
        
      case 'COMPLETED':
        task.completedAt = new Date();
        this.metrics.completedTasks++;
        this.updateCompletionTime(task);
        this.moveToHistory(task);
        break;
        
      case 'FAILED':
        task.completedAt = new Date();
        this.metrics.failedTasks++;
        this.moveToHistory(task);
        break;
    }

    this.updateSuccessRate();
    
    this.logActivity('Task state updated', { 
      taskId, 
      oldState, 
      newState, 
      userId: task.userId 
    });

    // Notify state change
    await this.notifyStateChange(task, oldState, newState);
  }

  async getTaskStatus(taskId: string): Promise<AgentMessage> {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return {
        type: 'task_status_response',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: this.agentId,
        payload: {
          taskId,
          found: false,
          error: 'Task not found'
        }
      };
    }

    return {
      type: 'task_status_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      payload: {
        taskId,
        found: true,
        task: this.sanitizeTask(task),
        progress: this.calculateProgress(task),
        estimatedCompletion: this.estimateCompletion(task)
      }
    };
  }

  async getUserTasks(userId: string): Promise<AgentMessage> {
    const taskIds = this.userTasks.get(userId) || [];
    const userTasks = taskIds
      .map(id => this.tasks.get(id))
      .filter(task => task !== undefined)
      .map(task => this.sanitizeTask(task!));

    return {
      type: 'user_tasks_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      payload: {
        userId,
        tasks: userTasks,
        summary: this.getUserTaskSummary(userTasks)
      }
    };
  }

  async getActiveTasks(userId: string): Promise<string[]> {
    const taskIds = this.userTasks.get(userId) || [];
    return taskIds.filter(id => {
      const task = this.tasks.get(id);
      return task && ['NEW', 'ANALYZING', 'APPROVED', 'QUEUED', 'RUNNING', 'AWAITING_SIGN'].includes(task.state);
    });
  }

  async getMetrics(userId?: string): Promise<AgentMessage> {
    let metrics;
    
    if (userId) {
      metrics = this.calculateUserMetrics(userId);
    } else {
      metrics = { ...this.metrics };
    }

    return {
      type: 'task_metrics_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      payload: {
        userId,
        metrics,
        generatedAt: new Date().toISOString()
      }
    };
  }

  private calculateUserMetrics(userId: string): TaskMetrics {
    const taskIds = this.userTasks.get(userId) || [];
    const userTasks = taskIds.map(id => this.tasks.get(id)).filter(t => t) as Task[];
    
    const completed = userTasks.filter(t => t.state === 'COMPLETED');
    const failed = userTasks.filter(t => t.state === 'FAILED');
    
    const totalCompletionTime = completed.reduce((sum, task) => {
      if (task.startedAt && task.completedAt) {
        return sum + (task.completedAt.getTime() - task.startedAt.getTime());
      }
      return sum;
    }, 0);
    
    const avgCompletionTime = completed.length > 0 ? totalCompletionTime / completed.length : 0;
    const successRate = userTasks.length > 0 ? completed.length / (completed.length + failed.length) : 0;

    return {
      totalTasks: userTasks.length,
      completedTasks: completed.length,
      failedTasks: failed.length,
      averageCompletionTime: avgCompletionTime,
      successRate: successRate
    };
  }

  private calculateProgress(task: Task): number {
    switch (task.state) {
      case 'NEW': return 0;
      case 'ANALYZING': return 0.1;
      case 'APPROVED': return 0.2;
      case 'QUEUED': return 0.3;
      case 'RUNNING': return 0.6;
      case 'AWAITING_SIGN': return 0.8;
      case 'CONFIRMING': return 0.9;
      case 'COMPLETED': return 1.0;
      case 'FAILED': return 0;
      case 'CANCELLED': return 0;
      default: return 0;
    }
  }

  private estimateCompletion(task: Task): string | null {
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(task.state)) {
      return null;
    }

    const now = new Date();
    const estimatedMinutes = this.getEstimatedDuration(task.category);
    const completion = new Date(now.getTime() + estimatedMinutes * 60000);
    
    return completion.toISOString();
  }

  private getEstimatedDuration(category: string): number {
    const durationMap: Record<string, number> = {
      'contract_deployment': 8,
      'nft_operations': 3,
      'token_operations': 2,
      'defi_operations': 5,
      'information': 1,
      'automation': 3
    };
    
    return durationMap[category] || 5;
  }

  private sanitizeTask(task: Task): Partial<Task> {
    // Remove sensitive information and return safe task data
    return {
      id: task.id,
      userId: task.userId,
      category: task.category,
      title: task.title,
      description: task.description,
      state: task.state,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      estimatedDuration: task.estimatedDuration,
      error: task.error,
      retryCount: task.retryCount
    };
  }

  private getUserTaskSummary(tasks: Partial<Task>[]): any {
    const byState = tasks.reduce((acc, task) => {
      const state = task.state || 'unknown';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = tasks.reduce((acc, task) => {
      const category = task.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: tasks.length,
      byState,
      byCategory,
      recentActivity: tasks
        .filter(t => t.updatedAt)
        .sort((a, b) => (b.updatedAt!.getTime() - a.updatedAt!.getTime()))
        .slice(0, 5)
    };
  }

  private updateCompletionTime(task: Task): void {
    if (task.startedAt && task.completedAt) {
      const completionTime = task.completedAt.getTime() - task.startedAt.getTime();
      
      // Update running average
      const totalCompleted = this.metrics.completedTasks;
      const currentAvg = this.metrics.averageCompletionTime;
      
      this.metrics.averageCompletionTime = 
        ((currentAvg * (totalCompleted - 1)) + completionTime) / totalCompleted;
    }
  }

  private updateSuccessRate(): void {
    const total = this.metrics.completedTasks + this.metrics.failedTasks;
    this.metrics.successRate = total > 0 ? this.metrics.completedTasks / total : 0;
  }

  private moveToHistory(task: Task): void {
    // Move completed/failed tasks to history after some time
    setTimeout(() => {
      if (this.tasks.has(task.id)) {
        this.taskHistory.push({ ...task });
        this.tasks.delete(task.id);
        
        // Keep history limited
        if (this.taskHistory.length > 1000) {
          this.taskHistory = this.taskHistory.slice(-500);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes delay
  }

  private async notifyTaskRegistered(task: Task): Promise<void> {
    const notification: AgentMessage = {
      type: 'task_registered',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      payload: {
        taskId: task.id,
        userId: task.userId,
        category: task.category,
        title: task.title
      }
    };

    await this.sendMessage(notification);
  }

  private async notifyStateChange(task: Task, oldState: TaskState, newState: TaskState): Promise<void> {
    const notification: AgentMessage = {
      type: 'task_state_changed',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      payload: {
        taskId: task.id,
        userId: task.userId,
        oldState,
        newState,
        task: this.sanitizeTask(task)
      }
    };

    await this.sendMessage(notification);
  }

  private startPeriodicTasks(): void {
    // Clean up old tasks every hour
    setInterval(() => {
      this.cleanupOldTasks();
    }, 60 * 60 * 1000);

    // Update metrics every 5 minutes
    setInterval(() => {
      this.recalculateMetrics();
    }, 5 * 60 * 1000);
  }

  private cleanupOldTasks(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let cleaned = 0;

    for (const [taskId, task] of this.tasks.entries()) {
      if (task.completedAt && task.completedAt < cutoffTime) {
        this.taskHistory.push({ ...task });
        this.tasks.delete(taskId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logActivity('Cleaned up old tasks', { count: cleaned });
    }
  }

  private recalculateMetrics(): void {
    // Recalculate metrics from current tasks
    const allTasks = Array.from(this.tasks.values());
    
    this.metrics.totalTasks = allTasks.length + this.taskHistory.length;
    this.metrics.completedTasks = allTasks.filter(t => t.state === 'COMPLETED').length;
    this.metrics.failedTasks = allTasks.filter(t => t.state === 'FAILED').length;
    
    this.updateSuccessRate();
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