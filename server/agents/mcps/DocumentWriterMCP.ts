// Document Writer MCP Agent - Generates documentation and guides with session signer support
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';
import { ServerSessionManager } from '../../lib/SessionManager';

export class DocumentWriterMCP extends BaseAgent {
  private sessionSigners: ServerSessionManager;

  constructor(messageBroker: MessageBroker) {
    super('docwriter-mcp', messageBroker);
    this.sessionSigners = ServerSessionManager.getInstance();
  }

  protected initialize(): void {
    this.logActivity('Initializing Document Writer MCP');
    
    this.messageBroker.subscribe('execute_task', async (message: AgentMessage) => {
      if (message.payload.category === 'documentation') {
        await this.handleMessage(message);
      }
    });
  }

  getCapabilities(): string[] {
    return [
      'contract_documentation',
      'api_documentation',
      'user_guides',
      'technical_specs',
      'readme_generation',
      'deployment_guides'
    ];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      if (message.type === 'execute_task') {
        return await this.generateDocumentation(message);
      }
      return null;
    } catch (error) {
      console.error('[DocumentWriterMCP] Error:', error);
      return this.createErrorResponse(message, `Documentation generation failed: ${error}`);
    }
  }

  private async generateDocumentation(message: AgentMessage): Promise<AgentMessage> {
    const { taskId, parameters } = message.payload;
    
    // Simulate documentation generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = {
      type: 'documentation',
      content: `# Generated Documentation\n\nThis is automatically generated documentation based on your request.`,
      format: 'markdown',
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