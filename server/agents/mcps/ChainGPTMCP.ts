// ChainGPT MCP - Pure LLM Integration for Web3/Blockchain Analysis
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

export class ChainGPTMCP extends BaseAgent {
  private openaiClient: OpenAI;
  private capabilities = new Set<string>();

  constructor(messageBroker: MessageBroker) {
    super('chaingpt-mcp', messageBroker);
    
    // Initialize OpenAI client
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      console.warn('[ChainGPTMCP] OpenAI API key not found');
    }
  }

  protected initialize(): void {
    this.logActivity('Initializing ChainGPT MCP as pure LLM integration');
    this.setupCapabilities();
  }

  private setupCapabilities(): void {
    // Ensure capabilities is initialized
    if (!this.capabilities) {
      this.capabilities = new Set();
    }
    
    // Core blockchain capabilities
    this.capabilities.add('blockchain_analysis');
    this.capabilities.add('crypto_research');
    this.capabilities.add('market_analysis');
    this.capabilities.add('wallet_analysis');
    this.capabilities.add('token_analysis');
    this.capabilities.add('defi_analysis');
    this.capabilities.add('nft_analysis');
    this.capabilities.add('smart_contract_analysis');
    
    this.logActivity('ChainGPT capabilities initialized', { 
      capabilityCount: this.capabilities.size 
    });
  }

  getCapabilities(): string[] {
    return Array.from(this.capabilities);
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      if (message.type === 'execute_task') {
        return await this.processWithChainGPTLLM(message);
      }
      return null;
    } catch (error) {
      console.error('[ChainGPTMCP] Error handling message:', error);
      return this.createErrorResponse(message, `ChainGPT operation failed: ${error}`);
    }
  }

  private async processWithChainGPTLLM(message: AgentMessage): Promise<AgentMessage> {
    const { taskId, description, parameters } = message.payload;
    
    try {
      this.logActivity('Processing with ChainGPT LLM', { 
        taskId, 
        description: description?.substring(0, 100)
      });

      if (!this.openaiClient) {
        return this.createTaskResponse(taskId, false, 'ChainGPT LLM is currently unavailable');
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
          content: 'You are ChainGPT, a specialized blockchain and Web3 AI assistant. You have expertise in cryptocurrency, DeFi, NFTs, smart contracts, trading, market analysis, and all things blockchain. Provide helpful, accurate, and actionable responses to user questions about the Web3 ecosystem.'
        }, {
          role: 'user', 
          content: `${description}${contextInfo}`
        }],
        temperature: 0.7,
        max_tokens: 1000
      });

      const result = response.choices[0].message.content || 'No response from ChainGPT.';
      
      return this.createTaskResponse(taskId, true, result);
      
    } catch (error) {
      console.error('[ChainGPTMCP] LLM request failed:', error);
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
        agent: 'ChainGPTMCP'
      }
    };
  }
}