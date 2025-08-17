// Base Agent - Abstract class for all agents
import { MessageBroker } from './MessageBroker';
import { AgentMessage } from '../types/AgentTypes';

export abstract class BaseAgent {
  protected agentId: string;
  protected messageBroker: MessageBroker;
  protected state: Record<string, any> = {};
  protected lastActivity: Date = new Date();

  constructor(agentId: string, messageBroker: MessageBroker) {
    this.agentId = agentId;
    this.messageBroker = messageBroker;
    this.initialize();
  }

  protected abstract initialize(): void;
  
  abstract handleMessage(message: AgentMessage): Promise<AgentMessage | null>;
  
  abstract getCapabilities(): string[];

  protected async sendMessage(message: AgentMessage): Promise<void> {
    message.senderId = this.agentId;
    message.timestamp = new Date().toISOString();
    
    const eventType = message.type;
    await this.messageBroker.publish(eventType, message);
    
    this.lastActivity = new Date();
  }

  protected setState(key: string, value: any): void {
    this.state[key] = value;
  }

  protected getState(key: string): any {
    return this.state[key];
  }

  protected getAllState(): Record<string, any> {
    return { ...this.state };
  }

  protected logActivity(action: string, details?: any): void {
    console.log(`[${this.agentId}] ${action}`, details || '');
    this.lastActivity = new Date();
  }

  getStatus(): {
    agentId: string;
    lastActivity: Date;
    state: Record<string, any>;
  } {
    return {
      agentId: this.agentId,
      lastActivity: this.lastActivity,
      state: this.getAllState()
    };
  }

  async shutdown(): Promise<void> {
    this.logActivity('Shutting down');
    // Override in subclasses for cleanup
  }
}