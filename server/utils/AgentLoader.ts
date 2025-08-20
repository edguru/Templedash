import { agentConfigManager, AgentConfig } from '../config/AgentConfigManager';

/**
 * Agent Loader utility for dynamic agent initialization based on configuration
 */
export class AgentLoader {
  private static instance: AgentLoader;
  private loadedAgents: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): AgentLoader {
    if (!AgentLoader.instance) {
      AgentLoader.instance = new AgentLoader();
    }
    return AgentLoader.instance;
  }

  /**
   * Initialize all agents based on configuration
   */
  public async initializeAllAgents(): Promise<void> {
    console.log('[AgentLoader] Starting agent initialization...');
    
    // Validate configuration first
    if (!agentConfigManager.validateConfig()) {
      throw new Error('Agent configuration validation failed');
    }

    const allAgents = agentConfigManager.getAllAgents();
    const stats = agentConfigManager.getAgentStats();
    
    console.log('[AgentLoader] Agent Statistics:', stats);

    // Initialize agents in priority order
    const priorityOrder: AgentConfig['priority'][] = ['critical', 'high', 'medium', 'low'];
    
    for (const priority of priorityOrder) {
      const agentsOfPriority = agentConfigManager.getAgentsByPriority(priority);
      await this.initializeAgentGroup(agentsOfPriority, priority);
    }

    console.log(`[AgentLoader] Successfully initialized ${this.loadedAgents.size} agents`);
  }

  /**
   * Initialize a group of agents with the same priority
   */
  private async initializeAgentGroup(agents: Record<string, AgentConfig>, priority: string): Promise<void> {
    const agentNames = Object.keys(agents);
    if (agentNames.length === 0) return;

    console.log(`[AgentLoader] Initializing ${agentNames.length} ${priority} priority agents:`, agentNames);

    // Initialize agents in parallel for better performance
    const initPromises = agentNames.map(agentName => 
      this.initializeAgent(agentName, agents[agentName])
    );

    await Promise.all(initPromises);
  }

  /**
   * Initialize a single agent
   */
  private async initializeAgent(agentName: string, config: AgentConfig): Promise<void> {
    try {
      console.log(`[AgentLoader] Initializing ${config.type} agent: ${agentName}`);
      
      // Apply configuration-based system message and capabilities
      const agentInstance = await this.createAgentInstance(agentName, config);
      
      if (agentInstance) {
        this.loadedAgents.set(agentName, agentInstance);
        console.log(`[AgentLoader] ✅ ${agentName} initialized successfully`);
      } else {
        console.warn(`[AgentLoader] ⚠️  Failed to create instance for ${agentName}`);
      }
    } catch (error) {
      console.error(`[AgentLoader] ❌ Error initializing ${agentName}:`, error);
    }
  }

  /**
   * Create agent instance based on configuration
   */
  private async createAgentInstance(agentName: string, config: AgentConfig): Promise<any> {
    // This would typically import the actual agent classes
    // For now, return a mock object that represents the configured agent
    
    const agentInstance = {
      name: config.name,
      type: config.type,
      role: config.role,
      systemMessage: config.systemMessage,
      capabilities: config.capabilities,
      tools: config.tools || [],
      keywords: config.keywords || [],
      priority: config.priority,
      loadFactor: config.loadFactor,
      successRate: config.successRate,
      averageLatency: config.averageLatency,
      
      // Agent methods
      async handleMessage(message: any): Promise<any> {
        console.log(`[${agentName}] Processing message with system prompt: ${config.systemMessage.substring(0, 100)}...`);
        return { success: true, agent: agentName, response: `Processed by ${config.name}` };
      },

      getCapabilities(): string[] {
        return config.capabilities;
      },

      getSystemMessage(): string {
        return config.systemMessage;
      },

      updateMetrics(metrics: any): void {
        agentConfigManager.updateAgentMetrics(agentName, metrics);
      }
    };

    return agentInstance;
  }

  /**
   * Get loaded agent by name
   */
  public getAgent(agentName: string): any | null {
    return this.loadedAgents.get(agentName) || null;
  }

  /**
   * Get all loaded agents
   */
  public getAllLoadedAgents(): Map<string, any> {
    return this.loadedAgents;
  }

  /**
   * Get agents by capability
   */
  public getAgentsByCapability(capability: string): any[] {
    const agents: any[] = [];
    
    this.loadedAgents.forEach((agent, agentName) => {
      if (agent.capabilities.includes(capability)) {
        agents.push(agent);
      }
    });

    return agents;
  }

  /**
   * Route message to appropriate agent based on configuration
   */
  public async routeMessage(message: string, requiredCapability?: string): Promise<any> {
    const routingRules = agentConfigManager.getRoutingRules();
    
    // Try primary routing first
    if (requiredCapability && routingRules.primary_routing[requiredCapability]) {
      const primaryAgent = routingRules.primary_routing[requiredCapability];
      const agent = this.getAgent(primaryAgent);
      
      if (agent) {
        console.log(`[AgentLoader] Routing to primary agent: ${primaryAgent} for capability: ${requiredCapability}`);
        return await agent.handleMessage(message);
      }
    }

    // Fall back to capability-based routing
    if (requiredCapability) {
      const capableAgents = this.getAgentsByCapability(requiredCapability);
      
      if (capableAgents.length > 0) {
        // Select agent with best performance metrics
        const bestAgent = capableAgents.reduce((best, current) => 
          current.successRate > best.successRate ? current : best
        );
        
        console.log(`[AgentLoader] Routing to best capable agent: ${bestAgent.name} for capability: ${requiredCapability}`);
        return await bestAgent.handleMessage(message);
      }
    }

    // Final fallback to fallback chain
    for (const fallbackAgent of routingRules.fallback_chain) {
      const agent = this.getAgent(fallbackAgent);
      if (agent) {
        console.log(`[AgentLoader] Using fallback agent: ${fallbackAgent}`);
        return await agent.handleMessage(message);
      }
    }

    throw new Error('No suitable agent found for message routing');
  }

  /**
   * Get agent performance report
   */
  public getPerformanceReport(): any {
    const report = {
      totalAgents: this.loadedAgents.size,
      agents: [] as any[]
    };

    this.loadedAgents.forEach((agent, agentName) => {
      report.agents.push({
        name: agentName,
        type: agent.type,
        priority: agent.priority,
        loadFactor: agent.loadFactor,
        successRate: agent.successRate,
        averageLatency: agent.averageLatency,
        capabilities: agent.capabilities.length
      });
    });

    // Sort by success rate descending
    report.agents.sort((a, b) => b.successRate - a.successRate);

    return report;
  }
}