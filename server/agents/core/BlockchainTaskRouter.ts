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
    
    // Network Detection - still useful for context
    const networks = this.detectNetworks(lowerTask);
    
    // Simple blockchain detection without hardcoded routing
    const isBlockchainRelated = this.isBlockchainTask(taskDescription);
    
    console.log('[BlockchainTaskRouter] AI-based analysis:', {
      task: lowerTask,
      isBlockchainRelated,
      networks,
      message: 'Pure AI agent selection - no hardcoded routing'
    });
    
    return {
      taskType: isBlockchainRelated ? 'query' : 'general',
      networks,
      suggestedAgent: undefined as any, // Let pure AI decide
      confidence: isBlockchainRelated ? 0.7 : 0.3,
      reasoning: isBlockchainRelated 
        ? ['Blockchain context detected', `Networks: ${networks.join(', ') || 'none specified'}`]
        : ['General task - no blockchain context detected']
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