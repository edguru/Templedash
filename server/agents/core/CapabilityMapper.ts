// Capability Mapper - Bridges high-level agent capabilities with specific task requirements
// Solves the Agent2Agent protocol capability matching gap identified in research

import { v4 as uuidv4 } from 'uuid';

interface CapabilityMapping {
  highLevel: string;
  specificTasks: string[];
  mcpTools: string[];
  agents: string[];
  priority: number;
  description: string;
}

interface TaskRequirement {
  category: string;
  operation?: string;
  specificNeeds?: string[];
  context?: any;
}

interface AgentCapability {
  agentId: string;
  capabilities: string[];
  specializations?: string[];
  loadScore?: number;
  successRate?: number;
}

interface CapabilityMatch {
  agentId: string;
  matchScore: number;
  matchType: 'exact' | 'semantic' | 'partial';
  mappedCapability: string;
  reasoning: string;
}

export class CapabilityMapper {
  private mappings: Map<string, CapabilityMapping> = new Map();
  private semanticMappings: Map<string, string[]> = new Map();
  private agentCapabilities: Map<string, AgentCapability> = new Map();

  constructor() {
    this.initializeCoreMappings();
    this.initializeSemanticMappings();
  }

  // Initialize core capability mappings based on research findings
  private initializeCoreMappings(): void {
    // ERC20 Token Deployment Mapping (highest priority)
    this.mappings.set('erc20_deployment', {
      highLevel: 'token-deployment',
      specificTasks: ['deploy_erc20', 'create_token', 'token_contract_deployment'],
      mcpTools: ['deploy_erc20_contract', 'create_token_contract', 'set_token_metadata'],
      agents: ['goat-mcp'],
      priority: 10,
      description: 'ERC20 token contract deployment and configuration'
    });

    // Contract Deployment Mapping
    this.mappings.set('contract_deployment', {
      highLevel: 'smart-contract-deployment',
      specificTasks: ['deploy_contract', 'contract_verification', 'contract_interaction'],
      mcpTools: ['deploy_contract', 'verify_contract', 'interact_contract'],
      agents: ['goat-mcp', 'codegen-mcp'],
      priority: 9,
      description: 'Smart contract deployment and management'
    });

    // Blockchain Operations Mapping
    this.mappings.set('blockchain_operations', {
      highLevel: 'blockchain-operations',
      specificTasks: ['balance_check', 'token_transfer', 'blockchain_query', 'transaction_status'],
      mcpTools: ['check_balance', 'transfer_tokens', 'query_blockchain', 'get_transaction'],
      agents: ['goat-mcp', 'nebula-mcp'],
      priority: 8,
      description: 'Core blockchain interaction capabilities'
    });

    // NFT Operations Mapping
    this.mappings.set('nft_operations', {
      highLevel: 'nft-management',
      specificTasks: ['nft_mint', 'nft_deploy', 'nft_metadata', 'nft_transfer'],
      mcpTools: ['mint_nft', 'deploy_nft_contract', 'upload_metadata', 'transfer_nft'],
      agents: ['nebula-mcp', 'goat-mcp'],
      priority: 7,
      description: 'NFT creation and management operations'
    });

    // DeFi Operations Mapping
    this.mappings.set('defi_operations', {
      highLevel: 'defi-protocols',
      specificTasks: ['token_swap', 'liquidity_provision', 'yield_farming', 'lending'],
      mcpTools: ['execute_swap', 'add_liquidity', 'stake_tokens', 'lend_assets'],
      agents: ['goat-mcp', 'nebula-mcp'],
      priority: 9,
      description: 'Decentralized finance protocol interactions'
    });

    // Smart Contract Operations
    this.mappings.set('smart_contracts', {
      highLevel: 'smart-contracts',
      specificTasks: ['contract_deploy', 'contract_call', 'contract_analysis', 'gas_estimation'],
      mcpTools: ['deploy_contract', 'call_function', 'analyze_contract', 'estimate_gas'],
      agents: ['nebula-mcp', 'goat-mcp'],
      priority: 8,
      description: 'Smart contract deployment and interaction'
    });

    // AI Reasoning Operations
    this.mappings.set('ai_reasoning', {
      highLevel: 'blockchain_reasoning',
      specificTasks: ['natural_language_query', 'contract_analysis', 'security_audit', 'optimization'],
      mcpTools: ['query_ai', 'analyze_security', 'suggest_optimizations', 'explain_contract'],
      agents: ['nebula-mcp'],
      priority: 6,
      description: 'AI-powered blockchain analysis and reasoning'
    });

    // Session Management
    this.mappings.set('session_management', {
      highLevel: 'session-signers',
      specificTasks: ['create_session', 'manage_permissions', 'sign_transaction', 'revoke_session'],
      mcpTools: ['create_signer', 'set_permissions', 'sign_tx', 'revoke_access'],
      agents: ['goat-mcp'],
      priority: 9,
      description: 'Session signer creation and management'
    });

    // Companion Operations
    this.mappings.set('companion_operations', {
      highLevel: 'companion_interactions',
      specificTasks: ['companion_chat', 'personality_response', 'relationship_aware', 'context_tracking'],
      mcpTools: ['process_message', 'generate_response', 'update_context', 'track_relationship'],
      agents: ['companion-handler'],
      priority: 10,
      description: 'AI companion interaction and personality management'
    });

    // Task Orchestration
    this.mappings.set('task_orchestration', {
      highLevel: 'task_management',
      specificTasks: ['task_analysis', 'agent_delegation', 'workflow_execution', 'result_synthesis'],
      mcpTools: ['analyze_task', 'delegate_to_agent', 'execute_workflow', 'synthesize_results'],
      agents: ['task-orchestrator', 'task-analyzer'],
      priority: 9,
      description: 'Multi-agent task coordination and execution'
    });
  }

  // Initialize semantic mappings for intelligent task matching  
  private initializeSemanticMappings(): void {
    // Map similar terms to canonical capabilities - enhanced with new agents
    
    // Blockchain operations (BlockchainAgent)
    this.semanticMappings.set('balance_check', ['check_balance', 'get_balance', 'wallet_balance', 'account_balance']);
    this.semanticMappings.set('token_transfer', ['send_tokens', 'transfer_tokens', 'move_funds', 'send_payment']);
    this.semanticMappings.set('nft_mint', ['mint_nft', 'create_nft', 'generate_nft', 'deploy_nft']);
    this.semanticMappings.set('erc20_deployment', ['deploy_token', 'create_token', 'launch_token', 'token_deployment', 'deploy_erc20']);
    this.semanticMappings.set('contract_deployment', ['deploy_contract', 'smart_contract', 'contract_creation']);
    this.semanticMappings.set('blockchain_query', ['query_blockchain', 'search_blockchain', 'blockchain_data', 'chain_info']);
    
    // Research operations (ResearchAgent)
    this.semanticMappings.set('market_research', ['market_analysis', 'industry_research', 'market_study', 'research_market']);
    this.semanticMappings.set('competitor_analysis', ['competitive_analysis', 'competitor_research', 'competition_study']);
    this.semanticMappings.set('trend_analysis', ['trend_research', 'market_trends', 'industry_trends', 'forecast']);
    
    // Code generation (CodeGenerationAgent)
    this.semanticMappings.set('smart_contract_development', ['write_contract', 'create_contract', 'solidity_code', 'contract_code']);
    this.semanticMappings.set('frontend_development', ['react_component', 'ui_component', 'frontend_code', 'web_component']);
    this.semanticMappings.set('api_development', ['api_endpoint', 'backend_code', 'server_code', 'rest_api']);
    this.semanticMappings.set('testing_automation', ['write_tests', 'test_suite', 'unit_tests', 'testing_code']);
    
    // Companion operations (existing)
    this.semanticMappings.set('companion_chat', ['chat_companion', 'talk_to_companion', 'companion_interaction', 'ai_conversation']);
  }

  // Register agent capabilities for intelligent routing
  registerAgentCapabilities(agentId: string, capabilities: string[], specializations?: string[]): void {
    this.agentCapabilities.set(agentId, {
      agentId,
      capabilities,
      specializations: specializations || [],
      loadScore: 0,
      successRate: 1.0
    });
  }

  // Update agent performance metrics
  updateAgentMetrics(agentId: string, loadScore: number, successRate: number): void {
    const agent = this.agentCapabilities.get(agentId);
    if (agent) {
      agent.loadScore = loadScore;
      agent.successRate = successRate;
    }
  }

  // Find best agent for a specific task requirement
  findBestAgent(taskRequirement: TaskRequirement): CapabilityMatch[] {
    const matches: CapabilityMatch[] = [];

    // First, try exact mapping
    const exactMapping = this.findExactMapping(taskRequirement);
    if (exactMapping) {
      matches.push(...this.scoreAgentsForMapping(exactMapping, 'exact'));
    }

    // Then, try semantic mapping
    const semanticMapping = this.findSemanticMapping(taskRequirement);
    if (semanticMapping) {
      matches.push(...this.scoreAgentsForMapping(semanticMapping, 'semantic'));
    }

    // Finally, try partial capability matching
    const partialMatches = this.findPartialMatches(taskRequirement);
    matches.push(...partialMatches);

    // Sort by match score (descending)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  // Find exact capability mapping
  private findExactMapping(taskRequirement: TaskRequirement): CapabilityMapping | null {
    // Check if task category directly maps to a capability
    for (const [key, mapping] of this.mappings.entries()) {
      if (mapping.specificTasks.includes(taskRequirement.category)) {
        return mapping;
      }
    }

    // Check if operation maps to a tool
    if (taskRequirement.operation) {
      for (const [key, mapping] of this.mappings.entries()) {
        if (mapping.mcpTools.includes(taskRequirement.operation)) {
          return mapping;
        }
      }
    }

    return null;
  }

  // Find semantic mapping using similarity matching
  private findSemanticMapping(taskRequirement: TaskRequirement): CapabilityMapping | null {
    const category = taskRequirement.category.toLowerCase();
    const operation = taskRequirement.operation?.toLowerCase();

    // Check semantic mappings
    for (const [canonical, variants] of this.semanticMappings.entries()) {
      if (variants.some(variant => 
        category.includes(variant) || 
        operation?.includes(variant) ||
        variant.includes(category)
      )) {
        // Find mapping that contains this canonical task
        for (const [key, mapping] of this.mappings.entries()) {
          if (mapping.specificTasks.includes(canonical)) {
            return mapping;
          }
        }
      }
    }

    return null;
  }

  // Find partial matches based on agent capabilities
  private findPartialMatches(taskRequirement: TaskRequirement): CapabilityMatch[] {
    const matches: CapabilityMatch[] = [];

    for (const [agentId, agentCapability] of this.agentCapabilities.entries()) {
      // Check if agent has any related capabilities
      const relatedCapabilities = agentCapability.capabilities.filter(cap => {
        const lowerCap = cap.toLowerCase();
        const lowerCategory = taskRequirement.category.toLowerCase();
        
        return lowerCap.includes(lowerCategory) || 
               lowerCategory.includes(lowerCap) ||
               this.areCapabilitiesRelated(cap, taskRequirement.category);
      });

      if (relatedCapabilities.length > 0) {
        const matchScore = this.calculatePartialMatchScore(
          agentCapability, 
          taskRequirement, 
          relatedCapabilities
        );

        matches.push({
          agentId,
          matchScore,
          matchType: 'partial',
          mappedCapability: relatedCapabilities[0],
          reasoning: `Partial match based on related capabilities: ${relatedCapabilities.join(', ')}`
        });
      }
    }

    return matches;
  }

  // Score agents for a specific mapping
  private scoreAgentsForMapping(mapping: CapabilityMapping, matchType: 'exact' | 'semantic'): CapabilityMatch[] {
    const matches: CapabilityMatch[] = [];

    for (const agentId of mapping.agents) {
      const agentCapability = this.agentCapabilities.get(agentId);
      if (agentCapability) {
        const baseScore = matchType === 'exact' ? 10 : 8;
        const loadPenalty = (agentCapability.loadScore || 0) * 0.1;
        const successBonus = (agentCapability.successRate || 1) * 2;
        
        const matchScore = baseScore - loadPenalty + successBonus;

        matches.push({
          agentId,
          matchScore,
          matchType,
          mappedCapability: mapping.highLevel,
          reasoning: `${matchType} match for ${mapping.description} (load: ${agentCapability.loadScore}, success: ${agentCapability.successRate})`
        });
      }
    }

    return matches;
  }

  // Calculate partial match score
  private calculatePartialMatchScore(
    agentCapability: AgentCapability, 
    taskRequirement: TaskRequirement, 
    relatedCapabilities: string[]
  ): number {
    let score = 3; // Base score for partial match

    // Bonus for multiple related capabilities
    score += relatedCapabilities.length * 0.5;

    // Bonus for specializations
    if (agentCapability.specializations?.some(spec => 
      taskRequirement.category.toLowerCase().includes(spec.toLowerCase())
    )) {
      score += 2;
    }

    // Performance adjustments
    score -= (agentCapability.loadScore || 0) * 0.1;
    score += (agentCapability.successRate || 1) * 1;

    return Math.max(0, score);
  }

  // Check if two capabilities are related
  private areCapabilitiesRelated(cap1: string, cap2: string): boolean {
    const relatedGroups = [
      ['blockchain', 'crypto', 'token', 'wallet', 'transaction'],
      ['nft', 'erc721', 'collectible', 'metadata'],
      ['defi', 'swap', 'liquidity', 'yield', 'stake'],
      ['contract', 'deploy', 'smart', 'solidity'],
      ['companion', 'chat', 'ai', 'conversation', 'personality'],
      ['task', 'orchestration', 'delegation', 'workflow']
    ];

    const lowerCap1 = cap1.toLowerCase();
    const lowerCap2 = cap2.toLowerCase();

    return relatedGroups.some(group => 
      group.some(term => lowerCap1.includes(term)) &&
      group.some(term => lowerCap2.includes(term))
    );
  }

  // Get all capability mappings
  getAllMappings(): Map<string, CapabilityMapping> {
    return new Map(this.mappings);
  }

  // Get registered agents
  getRegisteredAgents(): Map<string, AgentCapability> {
    return new Map(this.agentCapabilities);
  }

  // Normalize capability for Agent2Agent protocol
  normalizeCapability(capability: string): string[] {
    // Find specific tasks for high-level capability
    for (const [key, mapping] of this.mappings.entries()) {
      if (mapping.highLevel === capability || key === capability) {
        return mapping.specificTasks;
      }
    }

    // Check semantic mappings
    const semanticMatch = this.semanticMappings.get(capability);
    if (semanticMatch) {
      return semanticMatch;
    }

    // Return as-is if no mapping found
    return [capability];
  }

  // Get capability description
  getCapabilityDescription(capability: string): string {
    for (const [key, mapping] of this.mappings.entries()) {
      if (mapping.highLevel === capability || key === capability) {
        return mapping.description;
      }
    }
    return `Unknown capability: ${capability}`;
  }
}