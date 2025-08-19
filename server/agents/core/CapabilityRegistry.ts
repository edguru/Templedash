// Capability Registry for Dynamic Agent Discovery and Capability Advertising with CapabilityMapper integration
import { AgentMessage } from '../types/AgentTypes';
import { CapabilityMapper } from './CapabilityMapper';

export interface AgentCapability {
  agentId: string;
  capabilityName: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  securityLevel: 'low' | 'medium' | 'high';
  estimatedLatency: number; // milliseconds
  successRate: number; // 0-1
  currentLoad: number; // 0-1
  dependencies: string[]; // other capabilities needed
  cost: number; // relative cost 0-1
}

export interface TaskRequirement {
  taskType: string;
  priority: 'low' | 'medium' | 'high';
  securityLevel: 'low' | 'medium' | 'high';
  maxLatency?: number;
  requiredCapabilities: string[];
  context: Record<string, any>;
}

export class CapabilityRegistry {
  private capabilities: Map<string, AgentCapability[]> = new Map();
  private performanceHistory: Map<string, PerformanceMetrics> = new Map();
  private capabilityMapper: CapabilityMapper;

  constructor() {
    this.capabilityMapper = new CapabilityMapper();
    this.initializeCapabilities();
  }

  // Register capabilities for each agent
  registerCapability(capability: AgentCapability): void {
    const agentCapabilities = this.capabilities.get(capability.agentId) || [];
    agentCapabilities.push(capability);
    this.capabilities.set(capability.agentId, agentCapabilities);
  }

  // Find best agent(s) for a given task requirement using CapabilityMapper
  findBestAgentsForTask(requirement: TaskRequirement): AgentCapabilityMatch[] {
    const matches: AgentCapabilityMatch[] = [];
    
    // Use CapabilityMapper for intelligent task delegation
    const capabilityMatches = this.capabilityMapper.findBestAgent({
      category: requirement.taskType,
      specificNeeds: requirement.requiredCapabilities,
      context: requirement.context
    });
    
    // Convert CapabilityMapper results to AgentCapabilityMatch format
    for (const capMatch of capabilityMatches.slice(0, 3)) { // Top 3 matches
      const agentCapabilities = this.capabilities.get(capMatch.agentId);
      if (agentCapabilities) {
        matches.push({
          agentId: capMatch.agentId,
          capability: agentCapabilities[0], // Use first capability as representative
          score: capMatch.matchScore,
          reasoning: capMatch.reasoning
        });
      }
    }
    
    // Fallback to original logic if no matches found

    for (const [agentId, capabilities] of Array.from(this.capabilities.entries())) {
      for (const capability of capabilities) {
        const score = this.calculateCapabilityScore(capability, requirement);
        if (score > 0.3) { // Minimum threshold
          matches.push({
            agentId,
            capability,
            score,
            reasoning: this.generateReasoningForMatch(capability, requirement, score)
          });
        }
      }
    }

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
  }

  // Calculate capability fitness score for a task
  private calculateCapabilityScore(capability: AgentCapability, requirement: TaskRequirement): number {
    let score = 0;

    // Base capability match
    if (requirement.requiredCapabilities.includes(capability.capabilityName)) {
      score += 0.4;
    }

    // Security level compatibility
    const securityScore = this.calculateSecurityScore(capability.securityLevel, requirement.securityLevel);
    score += securityScore * 0.2;

    // Performance factors
    score += capability.successRate * 0.15;
    score += (1 - capability.currentLoad) * 0.1; // Lower load = higher score
    score += (1 - capability.cost) * 0.1; // Lower cost = higher score

    // Latency consideration
    if (requirement.maxLatency) {
      const latencyScore = Math.max(0, 1 - (capability.estimatedLatency / requirement.maxLatency));
      score += latencyScore * 0.05;
    }

    return Math.min(1, score);
  }

  private calculateSecurityScore(capabilityLevel: string, requiredLevel: string): number {
    const levels: Record<string, number> = { 'low': 1, 'medium': 2, 'high': 3 };
    const capLevel = levels[capabilityLevel];
    const reqLevel = levels[requiredLevel];
    
    if (capLevel >= reqLevel) {
      return 1;
    } else {
      return 0.3; // Penalty for insufficient security level
    }
  }

  private generateReasoningForMatch(capability: AgentCapability, requirement: TaskRequirement, score: number): string {
    const reasons = [];
    
    if (requirement.requiredCapabilities.includes(capability.capabilityName)) {
      reasons.push(`Direct capability match for ${capability.capabilityName}`);
    }
    
    if (capability.successRate > 0.8) {
      reasons.push(`High success rate (${(capability.successRate * 100).toFixed(1)}%)`);
    }
    
    if (capability.currentLoad < 0.3) {
      reasons.push(`Low current load (${(capability.currentLoad * 100).toFixed(1)}%)`);
    }
    
    return reasons.join(', ') || `General capability match (score: ${score.toFixed(2)})`;
  }

  // Update agent load and performance
  updateAgentMetrics(agentId: string, capabilityName: string, metrics: { 
    success: boolean, 
    latency: number, 
    load: number 
  }): void {
    const capabilities = this.capabilities.get(agentId) || [];
    const capability = capabilities.find(c => c.capabilityName === capabilityName);
    
    if (capability) {
      // Update current load
      capability.currentLoad = metrics.load;
      
      // Update success rate (exponential moving average)
      const alpha = 0.1;
      capability.successRate = alpha * (metrics.success ? 1 : 0) + (1 - alpha) * capability.successRate;
      
      // Update estimated latency (exponential moving average)
      capability.estimatedLatency = alpha * metrics.latency + (1 - alpha) * capability.estimatedLatency;
    }
  }

  private initializeCapabilities(): void {
    // Initialize known agent capabilities with new CrewAI agents
    const agentCapabilities: AgentCapability[] = [
      // BlockchainAgent capabilities
      {
        agentId: 'blockchain-agent',
        capabilityName: 'erc20_deployment',
        description: 'Deploy and manage ERC20 token contracts',
        securityLevel: 'high',
        estimatedLatency: 5000,
        successRate: 0.95,
        currentLoad: 0.2,
        cost: 0.8,
        dependencies: []
      },
      {
        agentId: 'blockchain-agent',
        capabilityName: 'blockchain_operations',
        description: 'Handle all blockchain-related operations and queries',
        securityLevel: 'high',
        estimatedLatency: 3000,
        successRate: 0.92,
        currentLoad: 0.3,
        cost: 0.7,
        dependencies: []
      },
      {
        agentId: 'blockchain-agent',
        capabilityName: 'contract_deployment',
        description: 'Deploy and verify smart contracts',
        securityLevel: 'high',
        estimatedLatency: 8000,
        successRate: 0.88,
        currentLoad: 0.4,
        cost: 0.9,
        dependencies: []
      },

      // ResearchAgent capabilities
      {
        agentId: 'research-agent',
        capabilityName: 'market_research',
        description: 'Conduct comprehensive market analysis and research',
        securityLevel: 'medium',
        estimatedLatency: 10000,
        successRate: 0.93,
        currentLoad: 0.1,
        cost: 0.6,
        dependencies: []
      },
      {
        agentId: 'research-agent',
        capabilityName: 'competitor_analysis',
        description: 'Analyze competitors and market positioning',
        securityLevel: 'medium',
        estimatedLatency: 8000,
        successRate: 0.91,
        currentLoad: 0.15,
        cost: 0.5,
        dependencies: []
      },

      // CodeGenerationAgent capabilities
      {
        agentId: 'code-generation-agent',
        capabilityName: 'smart_contract_development',
        description: 'Generate and optimize smart contracts',
        securityLevel: 'high',
        estimatedLatency: 7000,
        successRate: 0.89,
        currentLoad: 0.25,
        cost: 0.8,
        dependencies: []
      },
      {
        agentId: 'code-generation-agent',
        capabilityName: 'code_generation',
        description: 'Generate frontend, backend, and utility code',
        securityLevel: 'medium',
        estimatedLatency: 5000,
        successRate: 0.94,
        currentLoad: 0.2,
        cost: 0.6,
        dependencies: []
      },

      // CompanionHandler capabilities (existing)
      {
        agentId: 'companion-handler',
        capabilityName: 'conversation',
        description: 'Handle conversational interactions and companion chat',
        inputSchema: { message: 'string', context: 'object' },
        outputSchema: { response: 'string', mood: 'string' },
        securityLevel: 'low',
        estimatedLatency: 100,
        successRate: 0.95,
        currentLoad: 0.1,
        dependencies: [],
        cost: 0.1
      },
      {
        agentId: 'companion-handler',
        capabilityName: 'task_detection',
        description: 'Detect task intents from natural language',
        inputSchema: { message: 'string', context: 'object' },
        outputSchema: { isTask: 'boolean', taskType: 'string', confidence: 'number' },
        securityLevel: 'medium',
        estimatedLatency: 150,
        successRate: 0.92,
        currentLoad: 0.2,
        dependencies: [],
        cost: 0.2
      },

      // TaskOrchestrator capabilities
      {
        agentId: 'task-orchestrator',
        capabilityName: 'task_routing',
        description: 'Route tasks to appropriate agents based on capabilities',
        inputSchema: { task: 'object', requirements: 'object' },
        outputSchema: { assignedAgents: 'array', executionPlan: 'object' },
        securityLevel: 'high',
        estimatedLatency: 200,
        successRate: 0.88,
        currentLoad: 0.3,
        dependencies: [],
        cost: 0.3
      },

      // GoatMCP capabilities
      {
        agentId: 'goat-mcp',
        capabilityName: 'balance_check',
        description: 'Check cryptocurrency token balances',
        inputSchema: { walletAddress: 'string', tokenContract: 'string' },
        outputSchema: { balance: 'number', token: 'string' },
        securityLevel: 'medium',
        estimatedLatency: 2000,
        successRate: 0.90,
        currentLoad: 0.1,
        dependencies: ['wallet_connection'],
        cost: 0.4
      },
      {
        agentId: 'goat-mcp',
        capabilityName: 'token_transfer',
        description: 'Transfer tokens between wallets',
        inputSchema: { from: 'string', to: 'string', amount: 'number', token: 'string' },
        outputSchema: { transactionHash: 'string', success: 'boolean' },
        securityLevel: 'high',
        estimatedLatency: 15000,
        successRate: 0.85,
        currentLoad: 0.2,
        dependencies: ['wallet_connection', 'gas_estimation'],
        cost: 0.8
      },

      // NebulaMCP capabilities
      {
        agentId: 'nebula-mcp',
        capabilityName: 'nft_mint',
        description: 'Mint NFTs on blockchain networks',
        inputSchema: { metadata: 'object', recipient: 'string', contractAddress: 'string' },
        outputSchema: { tokenId: 'number', transactionHash: 'string', explorer: 'string' },
        securityLevel: 'high',
        estimatedLatency: 10000,
        successRate: 0.93,
        currentLoad: 0.15,
        dependencies: ['contract_deployment'],
        cost: 0.7
      },
      {
        agentId: 'nebula-mcp',
        capabilityName: 'contract_deployment',
        description: 'Deploy smart contracts to blockchain networks',
        inputSchema: { contractCode: 'string', constructorArgs: 'array', network: 'string' },
        outputSchema: { contractAddress: 'string', transactionHash: 'string', explorer: 'string' },
        securityLevel: 'high',
        estimatedLatency: 20000,
        successRate: 0.87,
        currentLoad: 0.1,
        dependencies: [],
        cost: 0.9
      },

      // TaskAnalyzer capabilities
      {
        agentId: 'task-analyzer',
        capabilityName: 'feasibility_analysis',
        description: 'Analyze task feasibility and requirements',
        inputSchema: { task: 'object', context: 'object' },
        outputSchema: { feasible: 'boolean', requirements: 'array', risks: 'array' },
        securityLevel: 'medium',
        estimatedLatency: 500,
        successRate: 0.91,
        currentLoad: 0.25,
        dependencies: [],
        cost: 0.3
      },

      // BlockchainAgent capabilities
      {
        agentId: 'blockchain-agent',
        capabilityName: 'erc20_deployment',
        description: 'Deploy ERC20 tokens with comprehensive smart contract functionality',
        inputSchema: { name: 'string', symbol: 'string', supply: 'number', walletAddress: 'string' },
        outputSchema: { contractAddress: 'string', transactionHash: 'string', explorer: 'string', success: 'boolean' },
        securityLevel: 'high',
        estimatedLatency: 8000,
        successRate: 0.94,
        currentLoad: 0.1,
        dependencies: ['wallet_connection', 'gas_estimation'],
        cost: 0.6
      },
      {
        agentId: 'blockchain-agent',
        capabilityName: 'blockchain_operations',
        description: 'Comprehensive blockchain operations including balance checks, transfers, and contract interactions',
        inputSchema: { operation: 'string', walletAddress: 'string', parameters: 'object' },
        outputSchema: { result: 'object', transactionHash: 'string', success: 'boolean' },
        securityLevel: 'high',
        estimatedLatency: 5000,
        successRate: 0.92,
        currentLoad: 0.15,
        dependencies: ['wallet_connection'],
        cost: 0.5
      },
      {
        agentId: 'blockchain-agent',
        capabilityName: 'contract_deployment',
        description: 'Deploy various types of smart contracts including NFTs, tokens, and custom contracts',
        inputSchema: { contractType: 'string', parameters: 'object', walletAddress: 'string' },
        outputSchema: { contractAddress: 'string', transactionHash: 'string', success: 'boolean' },
        securityLevel: 'high',
        estimatedLatency: 12000,
        successRate: 0.89,
        currentLoad: 0.1,
        dependencies: ['wallet_connection', 'gas_estimation'],
        cost: 0.8
      },
      {
        agentId: 'blockchain-agent',
        capabilityName: 'nft_operations',
        description: 'NFT minting, transferring, and marketplace operations',
        inputSchema: { operation: 'string', nftData: 'object', walletAddress: 'string' },
        outputSchema: { tokenId: 'number', transactionHash: 'string', success: 'boolean' },
        securityLevel: 'high',
        estimatedLatency: 7000,
        successRate: 0.91,
        currentLoad: 0.12,
        dependencies: ['contract_deployment'],
        cost: 0.7
      },

      // ResearchAgent capabilities
      {
        agentId: 'research-agent',
        capabilityName: 'market_research',
        description: 'Comprehensive market analysis and trend research for blockchain, DeFi, and tech sectors',
        inputSchema: { topic: 'string', depth: 'string', timeframe: 'string' },
        outputSchema: { analysis: 'object', trends: 'array', recommendations: 'array' },
        securityLevel: 'low',
        estimatedLatency: 3000,
        successRate: 0.93,
        currentLoad: 0.2,
        dependencies: [],
        cost: 0.3
      },
      {
        agentId: 'research-agent',
        capabilityName: 'competitor_analysis',
        description: 'Detailed competitor analysis and market positioning research',
        inputSchema: { industry: 'string', competitors: 'array', focus: 'string' },
        outputSchema: { analysis: 'object', insights: 'array', strategy: 'object' },
        securityLevel: 'low',
        estimatedLatency: 4000,
        successRate: 0.91,
        currentLoad: 0.15,
        dependencies: [],
        cost: 0.4
      },
      {
        agentId: 'research-agent',
        capabilityName: 'trend_analysis',
        description: 'Analyze current and emerging trends in technology, blockchain, and digital markets',
        inputSchema: { sector: 'string', timeframe: 'string', scope: 'string' },
        outputSchema: { trends: 'array', predictions: 'array', impact: 'object' },
        securityLevel: 'low',
        estimatedLatency: 2500,
        successRate: 0.94,
        currentLoad: 0.18,
        dependencies: [],
        cost: 0.3
      },

      // CodeGenerationAgent capabilities
      {
        agentId: 'code-generation-agent',
        capabilityName: 'smart_contract_development',
        description: 'Generate and optimize smart contracts in Solidity with security best practices',
        inputSchema: { contractType: 'string', requirements: 'object', network: 'string' },
        outputSchema: { contractCode: 'string', documentation: 'string', tests: 'array' },
        securityLevel: 'high',
        estimatedLatency: 6000,
        successRate: 0.88,
        currentLoad: 0.1,
        dependencies: [],
        cost: 0.6
      },
      {
        agentId: 'code-generation-agent',
        capabilityName: 'frontend_development',
        description: 'Generate React/TypeScript components with Web3 integration and responsive design',
        inputSchema: { componentType: 'string', requirements: 'object', framework: 'string' },
        outputSchema: { code: 'string', styles: 'string', documentation: 'string' },
        securityLevel: 'medium',
        estimatedLatency: 4000,
        successRate: 0.92,
        currentLoad: 0.15,
        dependencies: [],
        cost: 0.4
      },
      {
        agentId: 'code-generation-agent',
        capabilityName: 'api_development',
        description: 'Generate backend APIs, database schemas, and microservices architecture',
        inputSchema: { apiType: 'string', endpoints: 'array', database: 'string' },
        outputSchema: { code: 'string', schema: 'object', documentation: 'string' },
        securityLevel: 'medium',
        estimatedLatency: 5000,
        successRate: 0.90,
        currentLoad: 0.12,
        dependencies: [],
        cost: 0.5
      },
      {
        agentId: 'code-generation-agent',
        capabilityName: 'testing_automation',
        description: 'Generate comprehensive test suites, CI/CD pipelines, and quality assurance automation',
        inputSchema: { codebase: 'string', testType: 'string', coverage: 'string' },
        outputSchema: { tests: 'array', pipeline: 'object', reports: 'array' },
        securityLevel: 'medium',
        estimatedLatency: 3500,
        successRate: 0.89,
        currentLoad: 0.08,
        dependencies: [],
        cost: 0.4
      }
    ];

    // Register all capabilities
    agentCapabilities.forEach(cap => this.registerCapability(cap));
  }
}

export interface AgentCapabilityMatch {
  agentId: string;
  capability: AgentCapability;
  score: number;
  reasoning: string;
}

interface PerformanceMetrics {
  avgLatency: number;
  successRate: number;
  totalTasks: number;
  lastUpdated: Date;
}