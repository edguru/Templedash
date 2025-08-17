// Message Broker - Handles inter-agent communication
import { EventEmitter } from 'events';
import { AgentMessage } from '../types/AgentTypes';

export class MessageBroker extends EventEmitter {
  private messageHistory: AgentMessage[] = [];
  private maxHistorySize = 1000;

  constructor() {
    super();
    this.setMaxListeners(50); // Allow many agents to subscribe
  }

  async publish(eventType: string, message: AgentMessage): Promise<void> {
    try {
      // Store message in history
      this.messageHistory.push(message);
      if (this.messageHistory.length > this.maxHistorySize) {
        this.messageHistory.shift();
      }

      console.log(`Publishing message: ${eventType} from ${message.senderId} to ${message.targetId || 'broadcast'}`);
      
      // Emit event for subscribers
      this.emit(eventType, message);
      
      // Also emit to specific target if specified
      if (message.targetId) {
        this.emit(`${eventType}:${message.targetId}`, message);
      }
    } catch (error) {
      console.error('Error publishing message:', error);
      throw error;
    }
  }

  subscribe(eventType: string, handler: (message: AgentMessage) => Promise<void>): void {
    this.on(eventType, async (message: AgentMessage) => {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Error in message handler for ${eventType}:`, error);
      }
    });
  }

  subscribeToTarget(eventType: string, targetId: string, handler: (message: AgentMessage) => Promise<void>): void {
    this.subscribe(`${eventType}:${targetId}`, handler);
  }

  getMessageHistory(limit: number = 100): AgentMessage[] {
    return this.messageHistory.slice(-limit);
  }

  getMessagesForAgent(agentId: string, limit: number = 50): AgentMessage[] {
    return this.messageHistory
      .filter(msg => msg.senderId === agentId || msg.targetId === agentId)
      .slice(-limit);
  }

  shutdown(): void {
    this.removeAllListeners();
    this.messageHistory = [];
    console.log('Message broker shut down');
  }
}