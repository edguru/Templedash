// Agent Registry - Manages agent instances and discovery
import { BaseAgent } from './BaseAgent';

export class AgentRegistry {
  private agents = new Map<string, BaseAgent>();
  private agentMetadata = new Map<string, {
    type: string;
    status: 'active' | 'inactive' | 'error';
    lastSeen: Date;
    capabilities: string[];
  }>();

  register(agentId: string, agent: BaseAgent): void {
    this.agents.set(agentId, agent);
    this.agentMetadata.set(agentId, {
      type: agent.constructor.name,
      status: 'active',
      lastSeen: new Date(),
      capabilities: agent.getCapabilities()
    });
    
    console.log(`Registered agent: ${agentId} (${agent.constructor.name})`);
  }

  unregister(agentId: string): boolean {
    const removed = this.agents.delete(agentId);
    this.agentMetadata.delete(agentId);
    
    if (removed) {
      console.log(`Unregistered agent: ${agentId}`);
    }
    
    return removed;
  }

  getAgent(agentId: string): BaseAgent | undefined {
    const agent = this.agents.get(agentId);
    if (agent) {
      // Update last seen
      const metadata = this.agentMetadata.get(agentId);
      if (metadata) {
        metadata.lastSeen = new Date();
      }
    }
    return agent;
  }

  getAllAgents(): { id: string; agent: BaseAgent; metadata: any }[] {
    return Array.from(this.agents.entries()).map(([id, agent]) => ({
      id,
      agent,
      metadata: this.agentMetadata.get(id)
    }));
  }

  getAgentsByCapability(capability: string): BaseAgent[] {
    return Array.from(this.agents.entries())
      .filter(([id, agent]) => {
        const metadata = this.agentMetadata.get(id);
        return metadata?.capabilities.includes(capability);
      })
      .map(([id, agent]) => agent);
  }

  getAgentsByType(type: string): BaseAgent[] {
    return Array.from(this.agents.entries())
      .filter(([id, agent]) => agent.constructor.name === type)
      .map(([id, agent]) => agent);
  }

  updateAgentStatus(agentId: string, status: 'active' | 'inactive' | 'error'): void {
    const metadata = this.agentMetadata.get(agentId);
    if (metadata) {
      metadata.status = status;
      metadata.lastSeen = new Date();
    }
  }

  getHealthStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    this.agentMetadata.forEach((metadata, agentId) => {
      status[agentId] = {
        type: metadata.type,
        status: metadata.status,
        lastSeen: metadata.lastSeen,
        capabilities: metadata.capabilities
      };
    });
    
    return status;
  }

  cleanup(): void {
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    
    this.agentMetadata.forEach((metadata, agentId) => {
      if (metadata.lastSeen < cutoffTime && metadata.status !== 'active') {
        console.log(`Cleaning up inactive agent: ${agentId}`);
        this.unregister(agentId);
      }
    });
  }
}