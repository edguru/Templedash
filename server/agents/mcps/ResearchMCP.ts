// Research MCP Agent - Handles information gathering and analysis
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

export class ResearchMCP extends BaseAgent {
  constructor(messageBroker: MessageBroker) {
    super('research-mcp', messageBroker);
  }

  protected initialize(): void {
    this.logActivity('Initializing Research MCP');
    
    this.messageBroker.subscribe('execute_task', async (message: AgentMessage) => {
      if (message.payload.category === 'information') {
        await this.handleMessage(message);
      }
    });
  }

  getCapabilities(): string[] {
    return [
      'market_research',
      'price_analysis', 
      'contract_verification',
      'token_information',
      'defi_protocols',
      'security_audits'
    ];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      if (message.type === 'execute_task') {
        return await this.conductResearch(message);
      }
      return null;
    } catch (error) {
      console.error('[ResearchMCP] Error:', error);
      return this.createErrorResponse(message, `Research failed: ${error}`);
    }
  }

  private async conductResearch(message: AgentMessage): Promise<AgentMessage> {
    const { taskId, parameters } = message.payload;
    
    // Simulate research process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = {
      type: 'research_results',
      data: { summary: 'Research completed successfully' },
      sources: ['blockchain explorer', 'market data'],
      timestamp: new Date().toISOString()
    };

    return {
      type: 'task_step_complete',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'task-orchestrator',
      payload: { taskId, success: true, result }
    };
  }

  private createErrorResponse(originalMessage: AgentMessage, error: string): AgentMessage {
    return {
      type: 'error_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: originalMessage.senderId,
      payload: { error, originalMessageId: originalMessage.id }
    };
  }
}