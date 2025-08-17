// Agent Orchestrator - Coordinates agent interactions and workflows
import { MessageBroker } from './MessageBroker';
import { AgentRegistry } from './AgentRegistry';
import { AgentMessage, TaskState, UserMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

export class AgentOrchestrator {
  constructor(
    private messageBroker: MessageBroker,
    private registry: AgentRegistry
  ) {
    this.setupMessageRouting();
  }

  private setupMessageRouting() {
    // Route task assignments to task orchestrator
    this.messageBroker.subscribe('task_assignment', async (message: AgentMessage) => {
      const orchestrator = this.registry.getAgent('task-orchestrator');
      await orchestrator?.handleMessage(message);
    });

    // Route user messages to companion handler
    this.messageBroker.subscribe('user_message', async (message: AgentMessage) => {
      const companion = this.registry.getAgent('companion-handler');
      await companion?.handleMessage(message);
    });

    // Route status updates to task tracker
    this.messageBroker.subscribe('status_update', async (message: AgentMessage) => {
      const tracker = this.registry.getAgent('task-tracker');
      await tracker?.handleMessage(message);
    });
  }

  async processUserMessage(userId: string, message: string, conversationId: string) {
    try {
      const userMessage: UserMessage = {
        type: 'user_message',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        userId,
        conversationId,
        payload: {
          message,
          context: {
            conversationId,
            timestamp: new Date().toISOString()
          }
        }
      };

      console.log(`Processing user message from ${userId}: ${message.substring(0, 100)}...`);

      // Send to companion handler first
      await this.messageBroker.publish('user_message', userMessage);

      // Get prompt analysis
      const promptMessage: AgentMessage = {
        type: 'analyze_prompt',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: 'orchestrator',
        targetId: 'prompt-engineer',
        payload: {
          message,
          context: userMessage.payload.context
        }
      };

      const promptEngineer = this.registry.getAgent('prompt-engineer');
      const analysis = await promptEngineer?.handleMessage(promptMessage);

      if (analysis && analysis.payload.intent !== 'conversation') {
        // Create task if actionable intent detected
        const taskMessage: AgentMessage = {
          type: 'task_assignment',
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          senderId: 'orchestrator',
          targetId: 'task-orchestrator',
          payload: {
            taskId: uuidv4(),
            userId,
            category: analysis.payload.category,
            parameters: analysis.payload.parameters,
            priority: analysis.payload.priority || 'medium',
            estimatedDuration: analysis.payload.estimatedDuration || '5m'
          }
        };

        await this.messageBroker.publish('task_assignment', taskMessage);
        return {
          success: true,
          taskCreated: true,
          taskId: taskMessage.payload.taskId,
          response: `I'll help you ${analysis.payload.intent}. Creating task now...`
        };
      }

      return {
        success: true,
        taskCreated: false,
        response: 'How can I assist you today?'
      };

    } catch (error) {
      console.error('Error processing user message:', error);
      return {
        success: false,
        error: 'Failed to process message',
        response: 'Sorry, I encountered an error processing your request.'
      };
    }
  }

  async getTaskStatus(taskId: string) {
    const taskTracker = this.registry.getAgent('task-tracker');
    const statusMessage: AgentMessage = {
      type: 'get_task_status',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: 'orchestrator',
      targetId: 'task-tracker',
      payload: { taskId }
    };

    return await taskTracker?.handleMessage(statusMessage);
  }

  async shutdown() {
    console.log('Shutting down orchestrator...');
    // Implement graceful shutdown logic
  }
}