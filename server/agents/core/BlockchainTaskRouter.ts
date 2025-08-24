// Intelligent Blockchain Task Router - Routes tasks based on capabilities, not hardcoded rules
import { AgentSelectionRequest, AgentMatch } from './IntelligentAgentSelector';

export interface BlockchainTaskAnalysis {
  taskType: 'defi' | 'query' | 'analysis' | 'general';
  networks: string[];
  suggestedAgent: 'goat-agent' | 'nebula-mcp' | 'chaingpt-mcp';
  confidence: number;
  reasoning: string[];
}

export class BlockchainTaskRouter {
  
  /**
   * Analyze blockchain task and determine best agent based on capabilities
   */
  static analyzeBlockchainTask(taskDescription: string): BlockchainTaskAnalysis {
    const lowerTask = taskDescription.toLowerCase();
    
    // Blockchain Queries - Route to Nebula (highest priority - thirdweb capabilities)
    const nebulaKeywords = [
      'balance', 'check balance', 'wallet balance', 'how much', 'show balance',
      'wallet', 'address', 'transaction', 'transaction history', 'history', 'transfers',
      'send', 'transfer', 'deploy', 'contract', 'understand', 'interact', 'explore',
      'gas', 'block', 'network', 'token info', 'nft', 'erc20', 'erc721', 'erc1155',
      'what is', 'show me', 'display', 'retrieve', 'get', 'fetch'
    ];
    
    // DeFi Operations - Route to Goat Agent (based on loaded plugins)  
    const defiKeywords = [
      'swap', 'uniswap', 'trade', 'dex', 'amm',
      'liquidity', 'pool', 'yield', 'farm', 'stake',
      'lend', 'borrow', 'collateral', 'leverage',
      'bridge', 'cross-chain', 'polymarket', 'prediction',
      'jupiter', 'orca', 'debridge', '1inch', 'ionic'
    ];
    
    // Analysis & Research - Route to ChainGPT  
    const analysisKeywords = [
      'analyze', 'analysis', 'research', 'study', 'investigate', 'report',
      'market', 'price', 'trend', 'trends', 'data', 'statistics',
      'compare', 'evaluate', 'assess', 'audit', 'optimal', 'strategy', 'strategies'
    ];
    
    // Network Detection
    const networks = this.detectNetworks(lowerTask);
    
    // Determine task type and agent
    let taskType: 'defi' | 'query' | 'analysis' | 'general' = 'general';
    let suggestedAgent: 'goat-agent' | 'nebula-mcp' | 'chaingpt-mcp' = 'nebula-mcp';
    let confidence = 0.5;
    let reasoning: string[] = [];
    
    // Check for matches across all categories
    const nebulaMatches = nebulaKeywords.filter(keyword => lowerTask.includes(keyword));
    const defiMatches = defiKeywords.filter(keyword => lowerTask.includes(keyword));
    const analysisMatches = analysisKeywords.filter(keyword => lowerTask.includes(keyword));
    
    console.log('[BlockchainTaskRouter] Keyword analysis:', {
      task: lowerTask,
      nebulaMatches,
      defiMatches,
      analysisMatches,
      hasNebula: nebulaMatches.length > 0,
      hasAnalysis: analysisMatches.length > 0,
      hasBoth: nebulaMatches.length > 0 && analysisMatches.length > 0
    });
    
    // DeFi operations have highest priority
    if (defiMatches.length > 0) {
      taskType = 'defi';
      suggestedAgent = 'goat-agent';
      confidence = Math.min(0.9, 0.6 + (defiMatches.length * 0.1));
      reasoning.push(`DeFi operation detected: ${defiMatches.join(', ')}`);
      reasoning.push('Goat agent specializes in DeFi protocols with 200+ tools');
    }
    // If both Nebula and ChainGPT match, prioritize ChainGPT
    else if (nebulaMatches.length > 0 && analysisMatches.length > 0) {
      taskType = 'analysis';
      suggestedAgent = 'chaingpt-mcp';
      confidence = Math.min(0.85, 0.5 + (analysisMatches.length * 0.1) + (nebulaMatches.length * 0.05));
      reasoning.push(`Analysis task with blockchain query elements: ${analysisMatches.join(', ')}, ${nebulaMatches.join(', ')}`);
      reasoning.push('ChainGPT prioritized for comprehensive analysis over simple queries');
    }
    // Pure blockchain queries go to Nebula
    else if (nebulaMatches.length > 0) {
      taskType = 'query';
      suggestedAgent = 'nebula-mcp';
      confidence = Math.min(0.9, 0.6 + (nebulaMatches.length * 0.1));
      reasoning.push(`Blockchain query detected: ${nebulaMatches.join(', ')}`);
      reasoning.push('Nebula excels at blockchain interactions and data queries');
    }
    // Pure analysis tasks go to ChainGPT
    else if (analysisMatches.length > 0) {
      taskType = 'analysis';
      suggestedAgent = 'chaingpt-mcp';
      confidence = Math.min(0.8, 0.4 + (analysisMatches.length * 0.1));
      reasoning.push(`Analysis task detected: ${analysisMatches.join(', ')}`);
      reasoning.push('ChainGPT provides comprehensive blockchain analysis');
    }
    
    // Network-specific routing
    if (networks.length > 0) {
      reasoning.push(`Networks detected: ${networks.join(', ')}`);
      confidence += 0.1; // Boost confidence for network-specific tasks
    }
    
    return {
      taskType,
      networks,
      suggestedAgent,
      confidence: Math.min(confidence, 1.0),
      reasoning
    };
  }
  
  /**
   * Detect blockchain networks mentioned in task
   */
  private static detectNetworks(taskDescription: string): string[] {
    const networkKeywords: Record<string, string[]> = {
      'ethereum': ['ethereum', 'eth', 'mainnet'],
      'base': ['base', 'base network', 'base chain'],
      'polygon': ['polygon', 'matic', 'poly'],
      'arbitrum': ['arbitrum', 'arb', 'layer 2'],
      'optimism': ['optimism', 'op', 'optimistic'],
      'solana': ['solana', 'sol'],
      'bsc': ['bsc', 'binance', 'bnb chain'],
      'avalanche': ['avalanche', 'avax', 'c-chain'],
      'camp': ['camp', 'base camp', 'camp network']
    };
    
    const detectedNetworks: string[] = [];
    
    for (const [network, keywords] of Object.entries(networkKeywords)) {
      if (keywords.some(keyword => taskDescription.includes(keyword))) {
        detectedNetworks.push(network);
      }
    }
    
    // Default to Base Camp if no network specified but blockchain operation detected
    if (detectedNetworks.length === 0 && this.isBlockchainTask(taskDescription)) {
      detectedNetworks.push('camp');
    }
    
    return detectedNetworks;
  }
  
  /**
   * Check if task is blockchain-related
   */
  private static isBlockchainTask(taskDescription: string): boolean {
    const blockchainKeywords = [
      'blockchain', 'crypto', 'token', 'wallet', 'defi', 'nft',
      'transaction', 'contract', 'swap', 'bridge', 'stake'
    ];
    
    return blockchainKeywords.some(keyword => 
      taskDescription.toLowerCase().includes(keyword)
    );
  }
  
  /**
   * Generate enhanced task analysis with blockchain routing
   */
  static enhanceTaskAnalysis(request: AgentSelectionRequest): AgentSelectionRequest {
    const blockchainAnalysis = this.analyzeBlockchainTask(request.taskDescription);
    
    // Add blockchain-specific context
    const enhancedContext = {
      ...request.context,
      blockchainAnalysis,
      suggestedNetworks: blockchainAnalysis.networks,
      blockchainTaskType: blockchainAnalysis.taskType
    };
    
    return {
      ...request,
      context: enhancedContext
    };
  }
}