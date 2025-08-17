// Prompt Engineer Agent - Optimizes and clarifies user prompts for intent and task routing
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { SystemPrompts } from '../prompts/SystemPrompts';
import { v4 as uuidv4 } from 'uuid';

interface IntentAnalysis {
  intent: string;
  confidence: number;
  category: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: string;
  requiredPermissions: string[];
  clarificationNeeded: boolean;
  suggestions: string[];
}

export class PromptEngineer extends BaseAgent {
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private parameterExtractors: Map<string, (text: string) => Record<string, any>> = new Map();

  constructor(messageBroker: MessageBroker) {
    super('prompt-engineer', messageBroker);
  }

  protected initialize(): void {
    this.logActivity('Initializing Prompt Engineer');
    this.intentPatterns = new Map();
    this.parameterExtractors = new Map();
    this.setupIntentPatterns();
    this.setupParameterExtractors();
  }

  getCapabilities(): string[] {
    return [
      'intent_analysis',
      'parameter_extraction',
      'prompt_optimization',
      'task_classification',
      'ambiguity_detection'
    ];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      this.logActivity('Analyzing prompt', { type: message.type });

      if (message.type === 'analyze_prompt') {
        const analysis = await this.analyzePrompt(message.payload.message, message.payload.context);
        
        const responseMessage: AgentMessage = {
          type: 'prompt_analysis',
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          senderId: this.agentId,
          targetId: message.senderId,
          payload: analysis
        };

        await this.sendMessage(responseMessage);
        return responseMessage;
      }

      return null;
    } catch (error) {
      console.error('[PromptEngineer] Error analyzing prompt:', error);
      return this.createErrorResponse(message, 'Failed to analyze prompt');
    }
  }

  private async analyzePrompt(prompt: string, context: any): Promise<IntentAnalysis> {
    const normalizedPrompt = prompt.toLowerCase().trim();
    
    // Apply comprehensive system prompt for intent analysis
    const systemPrompt = SystemPrompts.getPromptEngineerPrompt();
    this.logActivity('Applying detailed prompt analysis', {
      promptLength: prompt.length,
      contextKeys: Object.keys(context || {}),
      systemPromptApplied: true
    });
    
    // Enhanced intent detection with system prompt context
    const intent = await this.detectIntent(normalizedPrompt);
    const confidence = await this.calculateConfidence(normalizedPrompt, intent);
    
    // Extract parameters based on intent
    const parameters = this.extractParameters(normalizedPrompt, intent);
    
    // Classify task category
    const category = this.classifyTaskCategory(intent);
    
    // Determine priority and duration
    const priority = this.determinePriority(normalizedPrompt, intent);
    const estimatedDuration = this.estimateDuration(intent, parameters);
    
    // Check for required permissions
    const requiredPermissions = this.getRequiredPermissions(intent, parameters);
    
    // Detect ambiguities and suggest clarifications
    const clarificationNeeded = this.needsClarification(normalizedPrompt, intent, parameters);
    const suggestions = this.generateSuggestions(normalizedPrompt, intent, parameters);

    return {
      intent,
      confidence,
      category,
      parameters,
      priority,
      estimatedDuration,
      requiredPermissions,
      clarificationNeeded,
      suggestions
    };
  }

  private async detectIntent(prompt: string): Promise<string> {
    let highestScore = 0;
    let detectedIntent = 'conversation';

    // Ensure intentPatterns is initialized
    if (!this.intentPatterns || this.intentPatterns.size === 0) {
      this.setupIntentPatterns();
    }

    // Use Array.from to handle iterator compatibility
    for (const [intent, patterns] of Array.from(this.intentPatterns.entries())) {
      for (const pattern of patterns) {
        const match = pattern.test(prompt);
        if (match) {
          const score = this.calculatePatternScore(prompt, pattern);
          if (score > highestScore) {
            highestScore = score;
            detectedIntent = intent;
          }
        }
      }
    }

    return detectedIntent;
  }

  private calculatePatternScore(prompt: string, pattern: RegExp): number {
    // Simple scoring based on match length and position
    const matches = prompt.match(pattern);
    if (!matches) return 0;
    
    const matchLength = matches[0].length;
    const matchPosition = prompt.indexOf(matches[0]);
    
    // Prefer longer matches and earlier positions
    return (matchLength / prompt.length) * 0.7 + (prompt.length - matchPosition) / prompt.length * 0.3;
  }

  private async calculateConfidence(prompt: string, intent: string): Promise<number> {
    // Calculate confidence based on multiple factors
    const keywordMatches = this.countKeywordMatches(prompt, intent);
    const ambiguityScore = this.calculateAmbiguityScore(prompt);
    const contextScore = this.calculateContextScore(prompt);
    
    const confidence = (keywordMatches * 0.4 + (1 - ambiguityScore) * 0.3 + contextScore * 0.3);
    return Math.max(0, Math.min(1, confidence));
  }

  private extractParameters(prompt: string, intent: string): Record<string, any> {
    const extractor = this.parameterExtractors.get(intent);
    if (extractor) {
      return extractor(prompt);
    }
    
    return this.genericParameterExtraction(prompt);
  }

  private setupIntentPatterns(): void {
    // Contract deployment patterns
    this.intentPatterns.set('deploy_contract', [
      /deploy\s+(?:smart\s+)?contract/i,
      /create\s+(?:new\s+)?contract/i,
      /launch\s+(?:a\s+)?contract/i,
      /(?:erc20|erc721|erc1155)\s+contract/i
    ]);

    // NFT minting patterns
    this.intentPatterns.set('mint_nft', [
      /mint\s+(?:nft|token)s?/i,
      /create\s+nft/i,
      /generate\s+nft/i,
      /(?:mint|create)\s+\d+\s+(?:nft|token)s?/i
    ]);

    // Token transfer patterns
    this.intentPatterns.set('transfer_tokens', [
      /send\s+(?:tokens?|crypto|coins?)/i,
      /transfer\s+(?:tokens?|\d+)/i,
      /pay\s+\w+/i,
      /send\s+\d+\s*(?:eth|usdc|dai|camp)/i
    ]);

    // Bridge patterns
    this.intentPatterns.set('bridge_tokens', [
      /bridge\s+(?:tokens?|funds)/i,
      /move\s+(?:tokens?|funds)\s+(?:to|from)/i,
      /cross[\s-]chain\s+transfer/i
    ]);

    // Staking patterns
    this.intentPatterns.set('stake_tokens', [
      /stake\s+(?:tokens?|eth|crypto)/i,
      /start\s+staking/i,
      /compound\s+(?:rewards|staking)/i
    ]);

    // Status check patterns
    this.intentPatterns.set('check_status', [
      /(?:check|show|get)\s+(?:status|balance|portfolio)/i,
      /what.{0,10}(?:balance|status|happening)/i,
      /how\s+much\s+(?:do\s+i\s+have|tokens?)/i
    ]);

    // Task management patterns
    this.intentPatterns.set('manage_tasks', [
      /(?:create|add|new)\s+task/i,
      /(?:schedule|automate)\s+/i,
      /set\s+up\s+automation/i,
      /remind\s+me\s+to/i
    ]);
  }

  private setupParameterExtractors(): void {
    // Contract deployment extractor
    this.parameterExtractors.set('deploy_contract', (prompt: string) => {
      const params: Record<string, any> = {};
      
      // Extract contract type
      if (/erc20/i.test(prompt)) params.contractType = 'ERC20';
      else if (/erc721/i.test(prompt)) params.contractType = 'ERC721';
      else if (/erc1155/i.test(prompt)) params.contractType = 'ERC1155';
      
      // Extract name
      const nameMatch = prompt.match(/(?:called|named)\s+["']([^"']+)["']/i);
      if (nameMatch) params.name = nameMatch[1];
      
      // Extract symbol
      const symbolMatch = prompt.match(/symbol\s+["']([^"']+)["']/i);
      if (symbolMatch) params.symbol = symbolMatch[1];
      
      // Extract supply
      const supplyMatch = prompt.match(/(?:supply|amount)\s+(?:of\s+)?(\d+)/i);
      if (supplyMatch) params.maxSupply = parseInt(supplyMatch[1]);
      
      return params;
    });

    // NFT minting extractor
    this.parameterExtractors.set('mint_nft', (prompt: string) => {
      const params: Record<string, any> = {};
      
      // Extract quantity
      const quantityMatch = prompt.match(/mint\s+(\d+)/i);
      if (quantityMatch) params.quantity = parseInt(quantityMatch[1]);
      
      // Extract recipient
      const recipientMatch = prompt.match(/(?:to|for)\s+(0x[a-fA-F0-9]{40})/);
      if (recipientMatch) params.recipient = recipientMatch[1];
      
      // Extract metadata
      const metadataMatch = prompt.match(/(?:with|metadata)\s+["']([^"']+)["']/i);
      if (metadataMatch) params.metadata = metadataMatch[1];
      
      return params;
    });

    // Token transfer extractor  
    this.parameterExtractors.set('transfer_tokens', (prompt: string) => {
      const params: Record<string, any> = {};
      
      // Extract amount
      const amountMatch = prompt.match(/(?:send|transfer)\s+(\d+(?:\.\d+)?)/i);
      if (amountMatch) params.amount = parseFloat(amountMatch[1]);
      
      // Extract token type
      const tokenMatch = prompt.match(/\d+\s*(eth|usdc|dai|camp|tokens?)/i);
      if (tokenMatch) params.token = tokenMatch[1].toLowerCase();
      
      // Extract recipient
      const recipientMatch = prompt.match(/(?:to|recipient)\s+(0x[a-fA-F0-9]{40})/);
      if (recipientMatch) params.recipient = recipientMatch[1];
      
      return params;
    });
  }

  private genericParameterExtraction(prompt: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract addresses
    const addresses = prompt.match(/0x[a-fA-F0-9]{40}/g);
    if (addresses) params.addresses = addresses;
    
    // Extract numbers
    const numbers = prompt.match(/\d+(?:\.\d+)?/g);
    if (numbers) params.numbers = numbers.map(n => parseFloat(n));
    
    // Extract quoted strings
    const quotedStrings = prompt.match(/["']([^"']+)["']/g);
    if (quotedStrings) params.strings = quotedStrings.map(s => s.slice(1, -1));
    
    return params;
  }

  private classifyTaskCategory(intent: string): string {
    const categoryMap: Record<string, string> = {
      'deploy_contract': 'contract_deployment',
      'mint_nft': 'nft_operations', 
      'transfer_tokens': 'token_operations',
      'bridge_tokens': 'defi_operations',
      'stake_tokens': 'defi_operations',
      'check_status': 'information',
      'manage_tasks': 'automation',
      'conversation': 'chat'
    };
    
    return categoryMap[intent] || 'general';
  }

  private determinePriority(prompt: string, intent: string): 'low' | 'medium' | 'high' {
    // Check for urgency indicators
    if (/urgent|asap|immediately|now|quickly/i.test(prompt)) {
      return 'high';
    }
    
    if (/later|eventually|when\s+convenient/i.test(prompt)) {
      return 'low';
    }
    
    // Intent-based priority
    const highPriorityIntents = ['transfer_tokens', 'deploy_contract'];
    const lowPriorityIntents = ['check_status', 'conversation'];
    
    if (highPriorityIntents.includes(intent)) return 'high';
    if (lowPriorityIntents.includes(intent)) return 'low';
    
    return 'medium';
  }

  private estimateDuration(intent: string, parameters: Record<string, any>): string {
    const durationMap: Record<string, string> = {
      'deploy_contract': '5-10m',
      'mint_nft': '2-5m',
      'transfer_tokens': '1-2m',
      'bridge_tokens': '5-15m',
      'stake_tokens': '3-8m',
      'check_status': '10-30s',
      'manage_tasks': '1-3m',
      'conversation': 'instant'
    };
    
    return durationMap[intent] || '2-5m';
  }

  private getRequiredPermissions(intent: string, parameters: Record<string, any>): string[] {
    const permissionMap: Record<string, string[]> = {
      'deploy_contract': ['contract_deploy', 'gas_spend'],
      'mint_nft': ['nft_mint', 'gas_spend'],
      'transfer_tokens': ['token_transfer', 'gas_spend'],
      'bridge_tokens': ['bridge_access', 'gas_spend'],
      'stake_tokens': ['staking_access', 'gas_spend'],
      'check_status': ['read_only'],
      'manage_tasks': ['task_management'],
      'conversation': []
    };
    
    return permissionMap[intent] || [];
  }

  private countKeywordMatches(prompt: string, intent: string): number {
    const keywords = this.getIntentKeywords(intent);
    let matches = 0;
    
    for (const keyword of keywords) {
      if (new RegExp(keyword, 'i').test(prompt)) {
        matches++;
      }
    }
    
    return Math.min(1, matches / keywords.length);
  }

  private getIntentKeywords(intent: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'deploy_contract': ['deploy', 'contract', 'smart', 'create', 'launch'],
      'mint_nft': ['mint', 'nft', 'token', 'create', 'generate'],
      'transfer_tokens': ['send', 'transfer', 'pay', 'move', 'tokens'],
      'bridge_tokens': ['bridge', 'cross-chain', 'move', 'network'],
      'stake_tokens': ['stake', 'staking', 'compound', 'rewards'],
      'check_status': ['check', 'status', 'balance', 'show', 'get'],
      'manage_tasks': ['task', 'schedule', 'automate', 'remind'],
      'conversation': ['hello', 'hi', 'help', 'what', 'how']
    };
    
    return keywordMap[intent] || [];
  }

  private calculateAmbiguityScore(prompt: string): number {
    // Higher score = more ambiguous
    let ambiguityScore = 0;
    
    // Check for vague terms
    const vagueTerms = ['thing', 'stuff', 'something', 'somehow', 'maybe'];
    for (const term of vagueTerms) {
      if (new RegExp(term, 'i').test(prompt)) {
        ambiguityScore += 0.2;
      }
    }
    
    // Check for questions vs statements
    if (prompt.includes('?')) {
      ambiguityScore += 0.1;
    }
    
    // Check for conditional language
    if (/might|could|would|should/i.test(prompt)) {
      ambiguityScore += 0.1;
    }
    
    return Math.min(1, ambiguityScore);
  }

  private calculateContextScore(prompt: string): number {
    // Higher score = better context
    let contextScore = 0;
    
    // Check for specific details
    if (/0x[a-fA-F0-9]{40}/.test(prompt)) contextScore += 0.3; // addresses
    if (/\d+(?:\.\d+)?/.test(prompt)) contextScore += 0.2; // numbers
    if (/["']([^"']+)["']/.test(prompt)) contextScore += 0.2; // quoted strings
    
    // Check for technical terms
    if (/erc20|erc721|erc1155|smart\s+contract/i.test(prompt)) contextScore += 0.3;
    
    return Math.min(1, contextScore);
  }

  private needsClarification(prompt: string, intent: string, parameters: Record<string, any>): boolean {
    // Check if essential parameters are missing
    const requiredParams: Record<string, string[]> = {
      'deploy_contract': ['contractType'],
      'mint_nft': ['quantity'],
      'transfer_tokens': ['amount', 'recipient'],
      'bridge_tokens': ['amount', 'targetNetwork']
    };
    
    const required = requiredParams[intent];
    if (required) {
      for (const param of required) {
        if (!parameters[param]) {
          return true;
        }
      }
    }
    
    return false;
  }

  private generateSuggestions(prompt: string, intent: string, parameters: Record<string, any>): string[] {
    const suggestions: string[] = [];
    
    if (intent === 'deploy_contract' && !parameters.contractType) {
      suggestions.push("What type of contract? (ERC20, ERC721, or ERC1155)");
    }
    
    if (intent === 'mint_nft' && !parameters.quantity) {
      suggestions.push("How many NFTs would you like to mint?");
    }
    
    if (intent === 'transfer_tokens' && !parameters.recipient) {
      suggestions.push("What's the recipient address?");
    }
    
    return suggestions;
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
        originalMessageId: originalMessage.id
      }
    };
  }
}