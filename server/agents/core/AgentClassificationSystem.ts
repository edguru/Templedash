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
  SCHEDULING = 'scheduling'
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
      agentId: 'blockchain-agent',
      agentName: 'BlockchainAgent',
      subcategory: TaskAgentSubcategory.BLOCKCHAIN,
      description: 'GOAT SDK-powered blockchain operations including token transfers, balance checks, and DeFi interactions on Base Camp network',
      keywords: ['blockchain', 'token', 'transfer', 'balance', 'defi', 'goat', 'sdk', 'camp'],
      useCases: [
        'Transfer CAMP tokens between wallets',
        'Check token balances and portfolio values',
        'Execute DeFi operations like swaps and staking',
        'Interact with ERC20 contracts',
        'Monitor blockchain transactions',
        'Manage wallet operations'
      ]
    });

    this.addTaskAgent({
      agentId: 'nebula-mcp', 
      agentName: 'NebulaMCP',
      subcategory: TaskAgentSubcategory.NFT,
      description: 'Thirdweb-powered NFT operations including minting, marketplace interactions, and gasless transactions with AI reasoning',
      keywords: ['nft', 'mint', 'thirdweb', 'gasless', 'marketplace', 'metadata'],
      useCases: [
        'Mint new NFT collections and individual tokens',
        'Execute gasless NFT transactions',
        'Interact with NFT marketplaces',
        'Deploy smart contracts with Thirdweb',
        'Analyze NFT market data',
        'Manage NFT metadata and royalties'
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
      agentId: 'goat-mcp',
      agentName: 'GoatMCP',
      subcategory: TaskAgentSubcategory.DEFI,
      description: 'Advanced DeFi operations with GOAT SDK integration, supporting multiple protocols and cross-chain operations',
      keywords: ['defi', 'goat', 'uniswap', 'liquidity', 'yield', 'farming', 'cross-chain'],
      useCases: [
        'Execute complex DeFi strategies',
        'Manage liquidity positions across protocols',
        'Perform cross-chain asset bridging',
        'Automate yield farming operations',
        'Analyze DeFi protocol performance', 
        'Execute multi-step DeFi transactions'
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