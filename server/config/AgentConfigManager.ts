import fs from 'fs';
import path from 'path';

export interface AgentConfig {
  name: string;
  type: 'core' | 'specialized' | 'mcp' | 'support' | 'framework';
  role: string;
  systemMessage: string;
  capabilities: string[];
  tools?: string[];
  keywords?: string[];
  plugins?: string[];
  supportedLanguages?: string[];
  supportedChains?: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  loadFactor: number;
  successRate: number;
  averageLatency: number;
}

export interface AgentRegistryConfig {
  metadata: {
    version: string;
    lastUpdated: string;
    totalAgents: number;
    architecture: string;
  };
  core_agents: Record<string, AgentConfig>;
  specialized_agents: Record<string, AgentConfig>;
  mcp_agents: Record<string, AgentConfig>;
  support_agents: Record<string, AgentConfig>;
  framework_agents: Record<string, AgentConfig>;
  routing_rules: {
    primary_routing: Record<string, string>;
    fallback_chain: string[];
    load_balancing: {
      max_concurrent_tasks: number;
      priority_queuing: boolean;
      adaptive_routing: boolean;
    };
  };
  integration_config: {
    message_broker: {
      type: string;
      topics: string[];
    };
    capability_registry: {
      auto_discovery: boolean;
      capability_mapping: boolean;
      performance_tracking: boolean;
    };
    session_management: {
      unified_sessions: boolean;
      cross_agent_context: boolean;
      session_persistence: boolean;
    };
  };
}

export class AgentConfigManager {
  private config: AgentRegistryConfig | null = null;
  private configPath: string;

  constructor() {
    this.configPath = path.join(__dirname, 'agents.json');
  }

  /**
   * Load agent configuration from JSON file
   */
  public loadConfig(): AgentRegistryConfig {
    try {
      if (!this.config) {
        const configData = fs.readFileSync(this.configPath, 'utf-8');
        const parsedConfig = JSON.parse(configData);
        this.config = parsedConfig.agentRegistry;
        console.log(`[AgentConfigManager] Loaded configuration for ${this.config.metadata.totalAgents} agents`);
      }
      return this.config;
    } catch (error) {
      console.error('[AgentConfigManager] Failed to load agent configuration:', error);
      throw new Error('Failed to load agent configuration');
    }
  }

  /**
   * Get all agents grouped by type
   */
  public getAllAgents(): Record<string, AgentConfig> {
    const config = this.loadConfig();
    return {
      ...config.core_agents,
      ...config.specialized_agents,
      ...config.mcp_agents,
      ...config.support_agents,
      ...config.framework_agents
    };
  }

  /**
   * Get agent configuration by name
   */
  public getAgentConfig(agentName: string): AgentConfig | null {
    const allAgents = this.getAllAgents();
    return allAgents[agentName] || null;
  }

  /**
   * Get agents by type
   */
  public getAgentsByType(type: AgentConfig['type']): Record<string, AgentConfig> {
    const config = this.loadConfig();
    
    switch (type) {
      case 'core':
        return config.core_agents;
      case 'specialized':
        return config.specialized_agents;
      case 'mcp':
        return config.mcp_agents;
      case 'support':
        return config.support_agents;
      case 'framework':
        return config.framework_agents;
      default:
        return {};
    }
  }

  /**
   * Get agents by capability
   */
  public getAgentsByCapability(capability: string): Record<string, AgentConfig> {
    const allAgents = this.getAllAgents();
    const matchingAgents: Record<string, AgentConfig> = {};

    Object.entries(allAgents).forEach(([agentName, config]) => {
      if (config.capabilities.includes(capability)) {
        matchingAgents[agentName] = config;
      }
    });

    return matchingAgents;
  }

  /**
   * Get agents by priority level
   */
  public getAgentsByPriority(priority: AgentConfig['priority']): Record<string, AgentConfig> {
    const allAgents = this.getAllAgents();
    const matchingAgents: Record<string, AgentConfig> = {};

    Object.entries(allAgents).forEach(([agentName, config]) => {
      if (config.priority === priority) {
        matchingAgents[agentName] = config;
      }
    });

    return matchingAgents;
  }

  /**
   * Get routing rules
   */
  public getRoutingRules() {
    const config = this.loadConfig();
    return config.routing_rules;
  }

  /**
   * Get integration configuration
   */
  public getIntegrationConfig() {
    const config = this.loadConfig();
    return config.integration_config;
  }

  /**
   * Update agent performance metrics
   */
  public updateAgentMetrics(agentName: string, metrics: Partial<Pick<AgentConfig, 'loadFactor' | 'successRate' | 'averageLatency'>>) {
    const config = this.loadConfig();
    const allAgents = this.getAllAgents();
    
    if (allAgents[agentName]) {
      // Update the agent config in memory
      Object.assign(allAgents[agentName], metrics);
      
      // Optionally persist to file (uncomment if needed)
      // this.saveConfig();
      
      console.log(`[AgentConfigManager] Updated metrics for ${agentName}:`, metrics);
    }
  }

  /**
   * Save configuration back to file
   */
  private saveConfig() {
    if (this.config) {
      try {
        const configToSave = { agentRegistry: this.config };
        fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2));
        console.log('[AgentConfigManager] Configuration saved successfully');
      } catch (error) {
        console.error('[AgentConfigManager] Failed to save configuration:', error);
      }
    }
  }

  /**
   * Validate agent configuration
   */
  public validateConfig(): boolean {
    try {
      const config = this.loadConfig();
      
      // Basic validation
      if (!config.metadata || !config.metadata.totalAgents) {
        throw new Error('Invalid metadata');
      }

      const allAgents = this.getAllAgents();
      const actualAgentCount = Object.keys(allAgents).length;
      
      if (actualAgentCount !== config.metadata.totalAgents) {
        console.warn(`[AgentConfigManager] Agent count mismatch: expected ${config.metadata.totalAgents}, found ${actualAgentCount}`);
      }

      // Validate required fields for each agent
      Object.entries(allAgents).forEach(([agentName, agentConfig]) => {
        if (!agentConfig.name || !agentConfig.role || !agentConfig.systemMessage) {
          throw new Error(`Invalid configuration for agent: ${agentName}`);
        }
      });

      console.log('[AgentConfigManager] Configuration validation passed');
      return true;
    } catch (error) {
      console.error('[AgentConfigManager] Configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Get agent statistics
   */
  public getAgentStats() {
    const allAgents = this.getAllAgents();
    const config = this.loadConfig();
    
    const stats = {
      totalAgents: Object.keys(allAgents).length,
      byType: {
        core: Object.keys(config.core_agents).length,
        specialized: Object.keys(config.specialized_agents).length,
        mcp: Object.keys(config.mcp_agents).length,
        support: Object.keys(config.support_agents).length,
        framework: Object.keys(config.framework_agents).length
      },
      byPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      averageLatency: 0,
      averageSuccessRate: 0
    };

    let totalLatency = 0;
    let totalSuccessRate = 0;

    Object.values(allAgents).forEach(agent => {
      stats.byPriority[agent.priority]++;
      totalLatency += agent.averageLatency;
      totalSuccessRate += agent.successRate;
    });

    stats.averageLatency = Math.round(totalLatency / stats.totalAgents);
    stats.averageSuccessRate = Number((totalSuccessRate / stats.totalAgents).toFixed(3));

    return stats;
  }
}

// Export singleton instance
export const agentConfigManager = new AgentConfigManager();