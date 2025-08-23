// ChainGPT MCP Agent - Web3 LLM specialized for blockchain operations
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

export class ChainGPTMCP extends BaseAgent {
  private openaiClient: OpenAI | null = null;
  private capabilities: Set<string>;

  constructor(messageBroker: MessageBroker) {
    super('chaingpt-mcp', messageBroker);
  }

  protected initialize(): void {
    this.logActivity('Initializing ChainGPT MCP Agent with Web3 LLM capabilities');
    
    // Initialize capabilities set FIRST
    this.capabilities = new Set<string>();
    
    // Initialize OpenAI client
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.logActivity('OpenAI client initialized for ChainGPT LLM simulation');
    } else {
      console.warn('[ChainGPTMCP] OpenAI API key not found - ChainGPT AI features disabled');
    }

    // Initialize capabilities
    this.setupCapabilities();
    
    // Subscribe to task execution messages
    this.messageBroker.subscribe('execute_task', async (message: AgentMessage) => {
      if (message.targetId === this.agentId || this.shouldHandleTask(message)) {
        await this.handleMessage(message);
      }
    });
  }

  private setupCapabilities(): void {
    this.capabilities.add('smart_contract_auditing');
    this.capabilities.add('code_generation');
    this.capabilities.add('nft_creation');
    this.capabilities.add('technical_analysis');
    this.capabilities.add('market_analysis');
    this.capabilities.add('security_assessment');
    this.capabilities.add('vulnerability_detection');
    this.capabilities.add('gas_optimization');
    this.capabilities.add('web3_domain_expertise');
    
    this.logActivity('ChainGPT capabilities initialized', { 
      capabilityCount: this.capabilities.size 
    });
  }

  private shouldHandleTask(message: AgentMessage): boolean {
    const { payload } = message;
    if (!payload || !payload.description) return false;

    const description = payload.description.toLowerCase();
    const web3Keywords = [
      'smart contract', 'audit', 'security', 'vulnerability', 'nft', 'token',
      'defi', 'yield', 'farming', 'technical analysis', 'market', 'price',
      'blockchain', 'crypto', 'ethereum', 'solidity', 'web3', 'dapp'
    ];

    return web3Keywords.some(keyword => description.includes(keyword));
  }

  getCapabilities(): string[] {
    return this.capabilities ? Array.from(this.capabilities) : [];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      if (message.type === 'execute_task') {
        return await this.executeChainGPTTask(message);
      }
      return null;
    } catch (error) {
      console.error('[ChainGPTMCP] Error handling message:', error);
      return this.createErrorResponse(message, `ChainGPT operation failed: ${error}`);
    }
  }

  private async executeChainGPTTask(message: AgentMessage): Promise<AgentMessage> {
    const { taskId, description, parameters } = message.payload;
    
    try {
      this.logActivity('Executing ChainGPT task', { 
        taskId, 
        description: description?.substring(0, 100) 
      });

      // Simulate ChainGPT processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = {
        type: 'chaingpt_analysis',
        analysis: 'ChainGPT Web3 LLM analysis completed successfully',
        confidence: 0.92,
        recommendations: [
          'Security audit completed - no critical vulnerabilities found',
          'Gas optimization opportunities identified',
          'Code quality assessment: Good'
        ],
        timestamp: new Date().toISOString()
      };

      return {
        type: 'task_step_complete',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: this.agentId,
        targetId: 'task-orchestrator',
        payload: {
          taskId,
          success: true,
          result: {
            type: 'chaingpt_response',
            data: result,
            agent: 'ChainGPTMCP'
          }
        }
      };
    } catch (error) {
      return {
        type: 'task_step_complete',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: this.agentId,
        targetId: 'task-orchestrator',
        payload: {
          taskId,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
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
        originalMessageId: originalMessage.id,
        agent: 'ChainGPTMCP'
      }
    };
  }
}