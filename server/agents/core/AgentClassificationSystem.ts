// Agent Classification System - Categorizes agents into Task vs Non-Task
// Task agents use RAG selection, Non-Task agents use traditional routing

export enum AgentCategory {
  TASK = 'task',
  NON_TASK = 'non_task'
}

export enum TaskAgentSubcategory {
  BLOCKCHAIN = 'blockchain',
  DEFI = 'defi', 
  NFT = 'nft',
  RESEARCH = 'research',
  CODE_GENERATION = 'code_generation',
  DOCUMENT_WRITING = 'document_writing',
  DATA_ANALYSIS = 'data_analysis',
  SCHEDULING = 'scheduling',
  WEB3_LLM = 'web3_llm'
}

export enum NonTaskAgentSubcategory {
  ORCHESTRATOR = 'orchestrator',
  COMPANION = 'companion',
  TRACKER = 'tracker',
  ANALYZER = 'analyzer',
  MEMORY = 'memory',
  USER_EXPERIENCE = 'user_experience',
  PROMPT_ENGINEERING = 'prompt_engineering'
}

export interface AgentClassification {
  agentId: string;
  agentName: string;
  category: AgentCategory;
  subcategory: TaskAgentSubcategory | NonTaskAgentSubcategory;
  useRAG: boolean;
  executionCapable: boolean;
  description: string;
  keywords: string[];
  useCases: string[];
}

export class AgentClassificationSystem {
  private classifications: Map<string, AgentClassification> = new Map();

  constructor() {
    this.initializeClassifications();
  }

  private initializeClassifications(): void {
    // TASK AGENTS - Use RAG selection for intelligent routing
    this.addTaskAgent({
      agentId: 'goat-agent',
      agentName: 'UnifiedGoatAgent', 
      subcategory: TaskAgentSubcategory.BLOCKCHAIN,
      description: 'GOAT SDK specialized plugin executor for specific DeFi protocols only. Handles Uniswap, 1inch, Jupiter, Curve, Polymarket, and other named DeFi protocol operations. Does NOT handle balance checks or generic blockchain operations.',
      keywords: ['uniswap', '1inch', 'jupiter', 'curve', 'polymarket', 'debridge', 'compound', 'aave', 'defi', 'protocol', 'plugin', 'goat', 'sdk', 'swap', 'liquidity', 'yield', 'farming', 'lending', 'borrowing', 'prediction', 'markets'],
      useCases: [
        'Execute Uniswap token swaps when Uniswap is specifically mentioned',
        'Perform 1inch aggregated swaps when 1inch is requested',
        'Execute Jupiter swaps on Solana when Jupiter is named',
        'Provide liquidity to Curve pools when Curve protocol is specified',
        'Trade on Polymarket prediction markets when Polymarket is mentioned',
        'Bridge assets via deBridge when deBridge protocol is requested',
        'Execute Compound lending/borrowing when Compound is named',
        'Perform Aave lending operations when Aave is specified',
        'Create session signers for automated DeFi protocol operations',
        'Execute multi-step DeFi strategies involving specific named protocols',
        'Handle complex protocol-specific workflows when protocols are explicitly mentioned'
      ]
    });

    this.addTaskAgent({
      agentId: 'nebula-mcp', 
      agentName: 'NebulaMCP',
      subcategory: TaskAgentSubcategory.NFT,
      description: 'Nebula LLM-powered cross-chain agent with real-time blockchain insights across 2,500+ EVM chains, natural language transaction execution, and intelligent Web3 reasoning',
      keywords: ['nebula', 'cross-chain', 'real-time', 'insights', 'natural language', 'transactions', 'evm', 'chains', 'web3', 'reasoning', 'nft', 'tokens', 'contracts'],
      useCases: [
        'Execute cross-chain transactions with natural language commands',
        'Provide real-time insights on token prices and contract states across 2,500+ EVM chains',
        'Analyze transaction patterns and suggest optimal gas timing',
        'Deploy and interact with smart contracts using natural language',
        'Monitor NFT collections and marketplace activity across multiple chains',
        'Bridge tokens between different blockchain networks',
        'Simulate transactions before execution for safety',
        'Reason about complex Web3 primitives and explain them simply',
        'Track portfolio performance across multiple chains in real-time',
        'Execute autonomous trading strategies based on market conditions',
        'Provide intelligent contract source code analysis',
        'Monitor blockchain events and trigger automated responses'
      ]
    });

    this.addTaskAgent({
      agentId: 'research-agent',
      agentName: 'ResearchAgent', 
      subcategory: TaskAgentSubcategory.RESEARCH,
      description: 'Comprehensive research and analysis agent with web search, data analysis, and report generation capabilities',
      keywords: ['research', 'analysis', 'data', 'investigate', 'study', 'report'],
      useCases: [
        'Research market trends and competitor analysis',
        'Analyze blockchain data and transaction patterns',
        'Generate comprehensive research reports',
        'Investigate technical documentation',
        'Compare protocols and technologies',
        'Gather intelligence on Web3 projects'
      ]
    });

    this.addTaskAgent({
      agentId: 'code-generation-agent',
      agentName: 'CodeGenerationAgent',
      subcategory: TaskAgentSubcategory.CODE_GENERATION,
      description: 'Advanced code generation and development agent supporting 15+ languages and 30+ frameworks',
      keywords: ['code', 'generate', 'develop', 'programming', 'smart contract', 'javascript'],
      useCases: [
        'Generate smart contracts and DApps',
        'Create frontend applications and components',
        'Build backend APIs and services',
        'Write automated tests and deployment scripts',
        'Generate documentation and code comments',
        'Refactor and optimize existing codebases'
      ]
    });


    this.addTaskAgent({
      agentId: 'docwriter-mcp',
      agentName: 'DocumentWriterMCP',
      subcategory: TaskAgentSubcategory.DOCUMENT_WRITING,
      description: 'Professional document creation and technical writing with markdown, API docs, and report generation',
      keywords: ['document', 'writing', 'markdown', 'report', 'documentation', 'technical'],
      useCases: [
        'Generate technical documentation',
        'Create API documentation and guides',
        'Write comprehensive project reports',
        'Produce marketing and whitepaper content',
        'Generate user manuals and tutorials',
        'Create structured data reports'
      ]
    });

    this.addTaskAgent({
      agentId: 'scheduler-mcp',
      agentName: 'SchedulerMCP',
      subcategory: TaskAgentSubcategory.SCHEDULING,
      description: 'Intelligent scheduling and automation agent for recurring tasks and time-based operations',
      keywords: ['schedule', 'automation', 'cron', 'recurring', 'timer', 'workflow'],
      useCases: [
        'Schedule recurring blockchain operations',
        'Automate portfolio rebalancing',
        'Set up price alert monitoring',
        'Create automated reporting workflows',
        'Manage time-based smart contract interactions',
        'Coordinate multi-step automated processes'
      ]
    });

    this.addTaskAgent({
      agentId: 'chaingpt-mcp',
      agentName: 'ChainGPTMCP',
      subcategory: TaskAgentSubcategory.WEB3_LLM,
      description: 'ChainGPT Web3 LLM with real-time on-chain and off-chain data integration, providing comprehensive market research, wallet intelligence, token analysis, social sentiment, NFT insights, regulatory updates, and developer utilities',
      keywords: ['chaingpt', 'web3', 'llm', 'smart contract', 'audit', 'security', 'vulnerability', 'code generation', 'nft', 'market research', 'wallet analysis', 'defi', 'tokenomics', 'crypto', 'blockchain', 'whale tracking', 'sentiment analysis', 'regulatory', 'compliance', 'real-time data', 'price analysis', 'arbitrage', 'ens', 'floor price'],
      useCases: [
        // Market Research & Analysis
        'Generate real-time crypto market overview reports with top movers and volume trends',
        'Produce comprehensive token and asset analysis reports covering fundamentals and metrics',
        'Explain sudden price movements through pump/dump diagnostics and whale activity',
        'Retrieve and summarize latest crypto news and market-moving announcements',
        
        // Wallet Analysis (NO balance fetching - delegated to Nebula)
        'Analyze wallet DeFi positions and portfolio composition strategies',
        'Track profit/loss patterns by examining transaction history trends',
        'Review wallet behavioral patterns and trading strategies',
        
        // Token Metrics & Analysis
        'Provide token price history with ATH/ATL values and historical comparisons',
        'Explain project tokenomics including supply, inflation rates, and distribution',
        'Retrieve upcoming token unlock schedules and vesting milestones',
        'Generate technical analysis with trading volume, market cap, and momentum indicators',
        
        // On-Chain Analytics
        'Monitor and report whale activities and large holder transactions',
        'Identify arbitrage opportunities and price discrepancies across DEXs',
        'Track emerging on-chain trends and sector narratives',
        'Trace complex transaction flows through multiple hops and protocols',
        
        // Social & Sentiment Insights
        'Track key opinion leader sentiments and mentions across social platforms',
        'Analyze community sentiment around tokens and protocols',
        'Detect trending projects and themes in social media conversations',
        'Contextualize news announcement impact and social reactions',
        
        // NFT & ENS Intelligence
        'Retrieve real-time NFT floor prices and collection statistics',
        'Analyze NFT portfolios and evaluate trait rarity',
        'Perform ENS domain lookups and reverse address resolution',
        'Track NFT market trends and emerging collection interest',
        
        // Regulatory & Compliance
        'Provide real-time crypto news summaries and regulatory updates',
        'Explain regulatory changes and compliance requirements across jurisdictions',
        'Perform compliance checks against sanction lists and security databases',
        'Report on market health indicators and institutional sentiment metrics',
        
        // Developer Utilities
        'Execute blockchain RPC calls and fetch live on-chain data',
        'Audit smart contract code for security vulnerabilities and best practices',
        'Generate Web3 code snippets and complete contract implementations',
        'Provide real-time price feeds and perform crypto asset calculations',
        
        // Autonomous Operations
        'Monitor blockchain events and market conditions continuously',
        'Execute multi-step task sequences autonomously',
        'Generate transaction payloads for on-chain operations',
        'Integrate with agent frameworks for real-time blockchain interactions'
      ]
    });

    // NON-TASK AGENTS - Use traditional routing, no RAG
    this.addNonTaskAgent({
      agentId: 'task-orchestrator',
      agentName: 'TaskOrchestrator',
      subcategory: NonTaskAgentSubcategory.ORCHESTRATOR,
      description: 'Central orchestration agent managing task distribution and coordination between agents'
    });

    this.addNonTaskAgent({
      agentId: 'companion-handler', 
      agentName: 'CompanionHandler',
      subcategory: NonTaskAgentSubcategory.COMPANION,
      description: 'AI companion interaction handler managing personalized conversations and relationships'
    });

    this.addNonTaskAgent({
      agentId: 'task-tracker',
      agentName: 'TaskTracker', 
      subcategory: NonTaskAgentSubcategory.TRACKER,
      description: 'Task monitoring and progress tracking system for all agent operations'
    });

    this.addNonTaskAgent({
      agentId: 'task-analyzer',
      agentName: 'TaskAnalyzer',
      subcategory: NonTaskAgentSubcategory.ANALYZER, 
      description: 'Task analysis and feasibility assessment for incoming requests'
    });

    this.addNonTaskAgent({
      agentId: 'profile-memory',
      agentName: 'ProfileMemory',
      subcategory: NonTaskAgentSubcategory.MEMORY,
      description: 'User profile and conversation memory management system'
    });

    this.addNonTaskAgent({
      agentId: 'user-experience',
      agentName: 'UserExperience', 
      subcategory: NonTaskAgentSubcategory.USER_EXPERIENCE,
      description: 'User experience optimization and interaction flow management'
    });

    this.addNonTaskAgent({
      agentId: 'prompt-engineer',
      agentName: 'PromptEngineer',
      subcategory: NonTaskAgentSubcategory.PROMPT_ENGINEERING,
      description: 'Prompt optimization and engineering for improved agent performance'
    });

    console.log(`[AgentClassificationSystem] Initialized with ${this.classifications.size} agents (${this.getTaskAgents().length} task, ${this.getNonTaskAgents().length} non-task)`);
  }

  private addTaskAgent(config: {
    agentId: string;
    agentName: string;
    subcategory: TaskAgentSubcategory;
    description: string;
    keywords: string[];
    useCases: string[];
  }): void {
    this.classifications.set(config.agentId, {
      ...config,
      category: AgentCategory.TASK,
      useRAG: true,
      executionCapable: true
    });
  }

  private addNonTaskAgent(config: {
    agentId: string;
    agentName: string;
    subcategory: NonTaskAgentSubcategory;
    description: string;
  }): void {
    this.classifications.set(config.agentId, {
      ...config,
      category: AgentCategory.NON_TASK,
      useRAG: false,
      executionCapable: false,
      keywords: [],
      useCases: []
    });
  }

  /**
   * Get all task agents that should use RAG selection
   */
  getTaskAgents(): AgentClassification[] {
    return Array.from(this.classifications.values())
      .filter(agent => agent.category === AgentCategory.TASK);
  }

  /**
   * Get all non-task agents that use traditional routing
   */
  getNonTaskAgents(): AgentClassification[] {
    return Array.from(this.classifications.values())
      .filter(agent => agent.category === AgentCategory.NON_TASK);
  }

  /**
   * Check if an agent should use RAG selection
   */
  shouldUseRAG(agentId: string): boolean {
    const agent = this.classifications.get(agentId);
    return agent?.useRAG || false;
  }

  /**
   * Get agent classification by ID
   */
  getAgentClassification(agentId: string): AgentClassification | undefined {
    return this.classifications.get(agentId);
  }

  /**
   * Get agents by category
   */
  getAgentsByCategory(category: AgentCategory): AgentClassification[] {
    return Array.from(this.classifications.values())
      .filter(agent => agent.category === category);
  }

  /**
   * Get task agents by subcategory
   */
  getTaskAgentsBySubcategory(subcategory: TaskAgentSubcategory): AgentClassification[] {
    return this.getTaskAgents()
      .filter(agent => agent.subcategory === subcategory);
  }

  /**
   * Add new task agent (for easy extensibility)
   */
  addNewTaskAgent(config: {
    agentId: string;
    agentName: string;
    subcategory: TaskAgentSubcategory;
    description: string;
    keywords: string[];
    useCases: string[];
  }): void {
    this.addTaskAgent(config);
    console.log(`[AgentClassificationSystem] Added new task agent: ${config.agentName}`);
  }

  /**
   * Get all classifications
   */
  getAllClassifications(): Map<string, AgentClassification> {
    return this.classifications;
  }
}