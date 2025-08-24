// Nebula MCP - Pure LLM Integration for Advanced Blockchain Operations  
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

export class NebulaMCP extends BaseAgent {
  private openaiClient: OpenAI;
  private capabilities = new Set<string>();

  constructor(messageBroker: MessageBroker) {
    super('nebula-mcp', messageBroker);
    
    // Initialize capabilities Set
    this.capabilities = new Set();
    
    // Initialize OpenAI client
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      console.warn('[NebulaMCP] OpenAI API key not found');
    }
  }

  protected initialize(): void {
    this.logActivity('Initializing Nebula MCP as pure LLM integration');
    this.setupCapabilities();
  }

  private setupCapabilities(): void {
    // Ensure capabilities is initialized
    if (!this.capabilities) {
      this.capabilities = new Set();
    }
    
    // Core blockchain development capabilities
    this.capabilities.add('blockchain_development');
    this.capabilities.add('smart_contract_deployment');
    this.capabilities.add('nft_operations');
    this.capabilities.add('token_operations');
    this.capabilities.add('defi_protocols');
    this.capabilities.add('gasless_transactions');
    this.capabilities.add('cross_chain_operations');
    this.capabilities.add('blockchain_infrastructure');
    
    this.logActivity('Nebula capabilities initialized', { 
      capabilityCount: this.capabilities.size 
    });
  }

  getCapabilities(): string[] {
    return Array.from(this.capabilities);
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      if (message.type === 'execute_task') {
        return await this.processWithNebulaLLM(message);
      }
      return null;
    } catch (error) {
      console.error('[NebulaMCP] Error handling message:', error);
      return this.createErrorResponse(message, `Nebula operation failed: ${error}`);
    }
  }

  private async processWithNebulaLLM(message: AgentMessage): Promise<AgentMessage> {
    const { taskId, description, parameters } = message.payload;
    
    try {
      this.logActivity('Processing with Nebula LLM', { 
        taskId, 
        description: description?.substring(0, 100)
      });

      if (!this.openaiClient) {
        return this.createTaskResponse(taskId, false, 'Nebula LLM is currently unavailable');
      }

      // Build context from parameters if available
      let contextInfo = '';
      if (parameters?.walletAddress || parameters?.address) {
        const address = parameters.walletAddress || parameters.address;
        contextInfo = `\n\nUser's wallet address: ${address}`;
      }

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [{
          role: 'system',
          content: 'You are Nebula, an advanced blockchain development and infrastructure AI assistant. You specialize in smart contract development, DeFi protocols, NFT operations, cross-chain bridges, gasless transactions, and complex blockchain architecture. Provide technical, actionable guidance for blockchain developers and advanced users.'
        }, {
          role: 'user', 
          content: `${description}${contextInfo}`
        }],
        temperature: 0.7,
        max_tokens: 1000
      });

      const result = response.choices[0].message.content || 'No response from Nebula.';
      
      return this.createTaskResponse(taskId, true, result);
      
    } catch (error) {
      console.error('[NebulaMCP] LLM request failed:', error);
      return this.createTaskResponse(taskId, false, 'I encountered an error processing your request. Please try again.');
    }
  }

  private createTaskResponse(taskId: string, success: boolean, result: string): AgentMessage {
    return {
      type: 'task_step_complete',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'task-orchestrator',
      payload: {
        taskId,
        success,
        result
      }
    };
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
        agent: 'NebulaMCP'
      }
    };
  }
}