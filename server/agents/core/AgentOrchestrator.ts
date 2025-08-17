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

      // Send to companion handler and wait for response
      return new Promise((resolve) => {
        let responseReceived = false;
        
        // Listen for companion response
        const cleanup = this.messageBroker.subscribe('companion_response', (companionMessage: AgentMessage) => {
          console.log('[AgentOrchestrator] Received companion response:', {
            userId: companionMessage.payload.userId,
            targetUserId: userId,
            requiresAction: companionMessage.payload.requiresAction,
            taskId: companionMessage.payload.taskId,
            response: companionMessage.payload.response?.substring(0, 100)
          });
          
          if (companionMessage.payload.userId === userId && !responseReceived) {
            responseReceived = true;
            cleanup(); // Clean up the subscription
            
            resolve({
              success: true,
              taskCreated: companionMessage.payload.requiresAction || false,
              taskId: companionMessage.payload.taskId || null,
              response: companionMessage.payload.response
            });
          }
        });
        
        // Set timeout to prevent hanging
        setTimeout(() => {
          if (!responseReceived) {
            responseReceived = true;
            cleanup();
            resolve({
              success: true,
              taskCreated: false,
              response: 'How can I assist you today?'
            });
          }
        }, 5000); // 5 second timeout
        
        // Send message to companion handler
        this.messageBroker.publish('user_message', userMessage);
      });

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