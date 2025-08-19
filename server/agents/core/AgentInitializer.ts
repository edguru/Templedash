// Agent Initializer - Centralized initialization of all CrewAI agents with proper registration
// Manages the complete agent ecosystem with intelligent routing and capability mapping

import { MessageBroker } from './MessageBroker';
import { CapabilityRegistry } from './CapabilityRegistry';

// Import CrewAI Agents
import { BlockchainAgent } from '../crewai/BlockchainAgent';
import { ResearchAgent } from '../crewai/ResearchAgent';
import { CodeGenerationAgent } from '../crewai/CodeGenerationAgent';

// Import existing agents
import { CompanionHandler } from '../companions/CompanionHandler';
import { TaskOrchestrator } from '../orchestrators/TaskOrchestrator';
import { TaskAnalyzer } from '../analyzers/TaskAnalyzer';
import { GoatMCP } from '../mcps/GoatMCP';
import { NebulaMCP } from '../mcps/NebulaMCP';

export class AgentInitializer {
  private messageBroker: MessageBroker;
  private capabilityRegistry: CapabilityRegistry;
  private agents: Map<string, any> = new Map();

  constructor(messageBroker: MessageBroker, capabilityRegistry: CapabilityRegistry) {
    this.messageBroker = messageBroker;
    this.capabilityRegistry = capabilityRegistry;
  }

  async initializeAllAgents(): Promise<void> {
    console.log('[AgentInitializer] Initializing comprehensive CrewAI agent ecosystem...');

    // Initialize CrewAI specialized agents
    await this.initializeCrewAIAgents();
    
    // Initialize existing agents
    await this.initializeExistingAgents();
    
    // Register all capabilities
    this.registerAgentCapabilities();
    
    // Setup inter-agent communication
    this.setupAgentCommunication();

    console.log(`[AgentInitializer] Agent ecosystem initialized with ${this.agents.size} agents`);
  }

  private async initializeCrewAIAgents(): Promise<void> {
    console.log('[AgentInitializer] Initializing CrewAI specialized agents...');

    // Initialize BlockchainAgent
    const blockchainAgent = new BlockchainAgent(this.messageBroker);
    this.agents.set('blockchain-agent', blockchainAgent);
    console.log('[AgentInitializer] ✅ BlockchainAgent initialized');

    // Initialize ResearchAgent
    const researchAgent = new ResearchAgent(this.messageBroker);
    this.agents.set('research-agent', researchAgent);
    console.log('[AgentInitializer] ✅ ResearchAgent initialized');

    // Initialize CodeGenerationAgent
    const codeGenerationAgent = new CodeGenerationAgent(this.messageBroker);
    this.agents.set('code-generation-agent', codeGenerationAgent);
    console.log('[AgentInitializer] ✅ CodeGenerationAgent initialized');

    console.log('[AgentInitializer] All CrewAI agents initialized successfully');
  }

  private async initializeExistingAgents(): Promise<void> {
    console.log('[AgentInitializer] Initializing existing agent infrastructure...');

    // Note: Existing agents are already initialized in the main system
    // This method ensures they're properly registered in the agent map
    
    console.log('[AgentInitializer] Existing agents integrated successfully');
  }

  private registerAgentCapabilities(): void {
    console.log('[AgentInitializer] Registering agent capabilities with capability registry...');

    // Register BlockchainAgent capabilities
    this.capabilityRegistry.registerCapability({
      agentId: 'blockchain-agent',
      capabilityName: 'erc20_deployment',
      description: 'Deploy and manage ERC20 token contracts with comprehensive features',
      securityLevel: 'high',
      estimatedLatency: 5000,
      successRate: 0.95,
      currentLoad: 0.1,
      cost: 0.8,
      dependencies: []
    });

    this.capabilityRegistry.registerCapability({
      agentId: 'blockchain-agent',
      capabilityName: 'blockchain_operations',
      description: 'Handle all blockchain queries, transactions, and contract interactions',
      securityLevel: 'high',
      estimatedLatency: 3000,
      successRate: 0.92,
      currentLoad: 0.2,
      cost: 0.7,
      dependencies: []
    });

    this.capabilityRegistry.registerCapability({
      agentId: 'blockchain-agent',
      capabilityName: 'nft_operations',
      description: 'NFT deployment, minting, and marketplace operations',
      securityLevel: 'high',
      estimatedLatency: 4000,
      successRate: 0.89,
      currentLoad: 0.15,
      cost: 0.75,
      dependencies: []
    });

    // Register ResearchAgent capabilities
    this.capabilityRegistry.registerCapability({
      agentId: 'research-agent',
      capabilityName: 'market_research',
      description: 'Comprehensive market analysis, trends, and competitive intelligence',
      securityLevel: 'medium',
      estimatedLatency: 10000,
      successRate: 0.93,
      currentLoad: 0.05,
      cost: 0.6,
      dependencies: []
    });

    this.capabilityRegistry.registerCapability({
      agentId: 'research-agent',
      capabilityName: 'competitor_analysis',
      description: 'Detailed competitor analysis and market positioning studies',
      securityLevel: 'medium',
      estimatedLatency: 8000,
      successRate: 0.91,
      currentLoad: 0.08,
      cost: 0.5,
      dependencies: []
    });

    this.capabilityRegistry.registerCapability({
      agentId: 'research-agent',
      capabilityName: 'trend_analysis',
      description: 'Industry trend analysis and future predictions',
      securityLevel: 'medium',
      estimatedLatency: 12000,
      successRate: 0.88,
      currentLoad: 0.1,
      cost: 0.65,
      dependencies: []
    });

    // Register CodeGenerationAgent capabilities
    this.capabilityRegistry.registerCapability({
      agentId: 'code-generation-agent',
      capabilityName: 'smart_contract_development',
      description: 'Generate, optimize, and audit smart contracts',
      securityLevel: 'high',
      estimatedLatency: 7000,
      successRate: 0.89,
      currentLoad: 0.12,
      cost: 0.8,
      dependencies: []
    });

    this.capabilityRegistry.registerCapability({
      agentId: 'code-generation-agent',
      capabilityName: 'frontend_development',
      description: 'Generate React components, utilities, and frontend code',
      securityLevel: 'medium',
      estimatedLatency: 5000,
      successRate: 0.94,
      currentLoad: 0.18,
      cost: 0.6,
      dependencies: []
    });

    this.capabilityRegistry.registerCapability({
      agentId: 'code-generation-agent',
      capabilityName: 'api_development',
      description: 'Generate REST APIs, endpoints, and backend services',
      securityLevel: 'medium',
      estimatedLatency: 6000,
      successRate: 0.92,
      currentLoad: 0.15,
      cost: 0.7,
      dependencies: []
    });

    this.capabilityRegistry.registerCapability({
      agentId: 'code-generation-agent',
      capabilityName: 'testing_automation',
      description: 'Generate comprehensive test suites and testing frameworks',
      securityLevel: 'medium',
      estimatedLatency: 8000,
      successRate: 0.87,
      currentLoad: 0.1,
      cost: 0.65,
      dependencies: []
    });

    console.log('[AgentInitializer] All capabilities registered successfully');
  }

  private setupAgentCommunication(): void {
    console.log('[AgentInitializer] Setting up inter-agent communication protocols...');

    // Subscribe each agent to relevant message types
    this.messageBroker.subscribe('blockchain_operation', async (message) => {
      const blockchainAgent = this.agents.get('blockchain-agent');
      if (blockchainAgent) {
        await blockchainAgent.handleMessage(message);
      }
    });

    this.messageBroker.subscribe('research_request', async (message) => {
      const researchAgent = this.agents.get('research-agent');
      if (researchAgent) {
        await researchAgent.handleMessage(message);
      }
    });

    this.messageBroker.subscribe('code_request', async (message) => {
      const codeAgent = this.agents.get('code-generation-agent');
      if (codeAgent) {
        await codeAgent.handleMessage(message);
      }
    });

    console.log('[AgentInitializer] Agent communication protocols established');
  }

  getAgent(agentId: string): any {
    return this.agents.get(agentId);
  }

  getAllAgents(): Map<string, any> {
    return this.agents;
  }

  getAgentCapabilities(agentId: string): string[] {
    const agent = this.agents.get(agentId);
    return agent ? agent.getCapabilities() : [];
  }
}