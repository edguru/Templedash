// ChainGPT MCP - Direct API Integration for Web3/Blockchain Analysis
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

export class ChainGPTMCP extends BaseAgent {
  private chainGPTApiKey: string;
  private capabilities = new Set<string>();

  constructor(messageBroker: MessageBroker) {
    super('chaingpt-mcp', messageBroker);
    
    // Initialize ChainGPT API key
    this.chainGPTApiKey = process.env.CHAINGPT_API_KEY || '';
    if (!this.chainGPTApiKey) {
      console.warn('[ChainGPTMCP] ChainGPT API key not found');
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
      this.logActivity('Processing with ChainGPT API', { 
        taskId, 
        description: description?.substring(0, 100)
      });

      if (!this.chainGPTApiKey) {
        return this.createTaskResponse(taskId, false, 'ChainGPT API key is not configured');
      }

      // Build context injection for ChainGPT API
      let contextInjection = {};
      let useCustomContext = false;
      let questionWithContext = description;

      if (parameters?.walletAddress || parameters?.address) {
        const address = parameters.walletAddress || parameters.address;
        contextInjection = {
          purpose: "Assist with blockchain and Web3 queries",
          aiTone: "PRE_SET_TONE",
          selectedTone: "INFORMATIVE"
        };
        useCustomContext = true;
        
        // Include wallet context in the question
        questionWithContext = `${description}\n\nUser's wallet address: ${address}`;
      }

      const requestBody = {
        model: "general_assistant",
        question: questionWithContext,
        chatHistory: "off",
        useCustomContext,
        ...(useCustomContext && { contextInjection })
      };

      console.log('[ChainGPTMCP] Making request to ChainGPT API');
      
      const response = await fetch('https://api.chaingpt.org/chat/stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.chainGPTApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`ChainGPT API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const answer = result.answer || result.response || 'No response from ChainGPT.';
      
      return this.createTaskResponse(taskId, true, answer);
      
    } catch (error) {
      console.error('[ChainGPTMCP] ChainGPT API request failed:', error);
      return this.createTaskResponse(taskId, false, 'I encountered an error processing your request with ChainGPT. Please try again.');
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