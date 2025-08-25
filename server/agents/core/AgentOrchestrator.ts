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

    // Route task analysis to task orchestrator
    this.messageBroker.subscribe('analyze_task', async (message: AgentMessage) => {
      const orchestrator = this.registry.getAgent('task-orchestrator');
      await orchestrator?.handleMessage(message);
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
        const cleanup = this.messageBroker.subscribe('companion_response', async (companionMessage: AgentMessage) => {
          console.log('[AgentOrchestrator] Received companion response:', {
            taskRouted: companionMessage.payload.taskRouted,
            taskCompleted: companionMessage.payload.taskCompleted,
            message: companionMessage.payload.message?.substring(0, 100),
            taskId: companionMessage.payload.taskId
          });
          
          if (!responseReceived) {
            responseReceived = true;
            enhancedCleanup();
            enhancedTaskCleanup(); // Clean up both listeners
            
            resolve({
              success: true,
              taskCreated: companionMessage.payload.taskRouted || companionMessage.payload.taskCompleted || false,
              taskId: companionMessage.payload.taskId || null,
              response: companionMessage.payload.message
            });
          }
        });
        
        // Also listen for task results if a task was routed
        const taskCleanup = this.messageBroker.subscribe('task_result', async (taskMessage: AgentMessage) => {
          console.log('[AgentOrchestrator] Received task result:', {
            result: taskMessage.payload.result?.substring(0, 100)
          });
          
          if (!responseReceived) {
            responseReceived = true;
            enhancedCleanup();
            enhancedTaskCleanup();
            
            resolve({
              success: true,
              taskCreated: true,
              taskId: taskMessage.payload.taskId || null,
              response: taskMessage.payload.result
            });
          }
        });
        
        // Set timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          if (!responseReceived) {
            responseReceived = true;
            enhancedCleanup();
            enhancedTaskCleanup();
            console.log('[AgentOrchestrator] ⏰ TIMEOUT - No response received in 30 seconds, using fallback');
            resolve({
              success: true,
              taskCreated: false,
              response: 'How can I assist you today?'
            });
          }
        }, 30000); // 30 second timeout for blockchain operations
        
        // Create enhanced cleanup function
        const enhancedCleanup = () => { 
          clearTimeout(timeoutId); 
          cleanup(); 
        };
        const enhancedTaskCleanup = () => { 
          clearTimeout(timeoutId); 
          taskCleanup(); 
        };
        
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