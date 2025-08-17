// Task Analyzer Agent - Extracts, classifies, and breaks down actionable tasks
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage, Task, TaskState } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

interface TaskAnalysis {
  feasible: boolean;
  breakdown: TaskStep[];
  requirements: string[];
  risks: string[];
  estimatedCost: number;
  networkRequirements: string[];
  securityLevel: 'low' | 'medium' | 'high';
  approvalRequired: boolean;
  reason?: string;
}

interface TaskStep {
  id: string;
  title: string;
  description: string;
  mcpAgent: string;
  estimatedDuration: string;
  dependencies: string[];
  parameters: Record<string, any>;
}

export class TaskAnalyzer extends BaseAgent {
  private networkStatus: Map<string, boolean>;
  private gasEstimates: Map<string, number>;

  constructor(messageBroker: MessageBroker) {
    super('task-analyzer', messageBroker);
  }

  protected initialize(): void {
    this.logActivity('Initializing Task Analyzer');
    
    this.networkStatus = new Map();
    this.gasEstimates = new Map();
    
    // Subscribe to task analysis requests
    this.messageBroker.subscribe('analyze_task', async (message: AgentMessage) => {
      await this.handleMessage(message);
    });

    // Initialize network monitoring
    this.initializeNetworkMonitoring();
  }

  getCapabilities(): string[] {
    return [
      'task_decomposition',
      'feasibility_analysis',
      'requirement_validation',
      'risk_assessment',
      'cost_estimation',
      'network_monitoring'
    ];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      this.logActivity('Analyzing task', { type: message.type });

      if (message.type === 'analyze_task') {
        const analysis = await this.analyzeTask(message.payload);
        
        const responseMessage: AgentMessage = {
          type: 'task_analysis',
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          senderId: this.agentId,
          targetId: message.senderId,
          payload: {
            taskId: message.payload.taskId,
            analysis
          }
        };

        await this.sendMessage(responseMessage);
        return responseMessage;
      }

      return null;
    } catch (error) {
      console.error('[TaskAnalyzer] Error analyzing task:', error);
      return this.createErrorResponse(message, 'Failed to analyze task');
    }
  }

  private async analyzeTask(taskPayload: any): Promise<TaskAnalysis> {
    const { category, parameters, priority } = taskPayload;
    
    // Perform feasibility check
    const feasible = await this.checkFeasibility(category, parameters);
    
    if (!feasible.feasible) {
      return {
        feasible: false,
        breakdown: [],
        requirements: [],
        risks: [],
        estimatedCost: 0,
        networkRequirements: [],
        securityLevel: 'low',
        approvalRequired: false,
        reason: feasible.reason
      };
    }

    // Break down task into steps
    const breakdown = await this.breakdownTask(category, parameters);
    
    // Analyze requirements and risks
    const requirements = await this.analyzeRequirements(category, parameters);
    const risks = await this.assessRisks(category, parameters, breakdown);
    
    // Estimate costs
    const estimatedCost = await this.estimateCosts(category, breakdown);
    
    // Determine network requirements
    const networkRequirements = this.getNetworkRequirements(category);
    
    // Assess security level
    const securityLevel = this.assessSecurityLevel(category, parameters);
    
    // Check if approval needed
    const approvalRequired = this.requiresApproval(category, parameters, estimatedCost);

    return {
      feasible: true,
      breakdown,
      requirements,
      risks,
      estimatedCost,
      networkRequirements,
      securityLevel,
      approvalRequired
    };
  }

  private async checkFeasibility(category: string, parameters: Record<string, any>): Promise<{feasible: boolean, reason?: string}> {
    // Check network availability
    const requiredNetworks = this.getNetworkRequirements(category);
    for (const network of requiredNetworks) {
      if (!this.networkStatus.get(network)) {
        return {
          feasible: false,
          reason: `Network ${network} is not available`
        };
      }
    }

    // Check parameter validity
    if (!this.validateParameters(category, parameters)) {
      return {
        feasible: false,
        reason: 'Invalid or missing required parameters'
      };
    }

    // Check for conflicting tasks (future enhancement)
    
    return { feasible: true };
  }

  private async breakdownTask(category: string, parameters: Record<string, any>): Promise<TaskStep[]> {
    const breakdownMap: Record<string, (params: Record<string, any>) => TaskStep[]> = {
      'contract_deployment': this.breakdownContractDeployment.bind(this),
      'nft_operations': this.breakdownNFTOperations.bind(this),
      'token_operations': this.breakdownTokenOperations.bind(this),
      'defi_operations': this.breakdownDeFiOperations.bind(this),
      'information': this.breakdownInformation.bind(this),
      'automation': this.breakdownAutomation.bind(this)
    };

    const breakdown = breakdownMap[category];
    return breakdown ? breakdown(parameters) : this.createGenericBreakdown(category, parameters);
  }

  private breakdownContractDeployment(parameters: Record<string, any>): TaskStep[] {
    const steps: TaskStep[] = [];
    
    // Step 1: Code generation
    steps.push({
      id: uuidv4(),
      title: 'Generate Smart Contract',
      description: `Generate ${parameters.contractType} contract code`,
      mcpAgent: 'codegen-mcp',
      estimatedDuration: '2-3m',
      dependencies: [],
      parameters: {
        contractType: parameters.contractType,
        name: parameters.name,
        symbol: parameters.symbol,
        maxSupply: parameters.maxSupply
      }
    });

    // Step 2: Contract compilation and validation
    steps.push({
      id: uuidv4(),
      title: 'Compile and Validate',
      description: 'Compile contract and run security checks',
      mcpAgent: 'codegen-mcp',
      estimatedDuration: '1-2m',
      dependencies: [steps[0].id],
      parameters: { validateSecurity: true }
    });

    // Step 3: Deployment
    steps.push({
      id: uuidv4(),
      title: 'Deploy Contract',
      description: 'Deploy contract to Base Camp network',
      mcpAgent: 'goat-mcp',
      estimatedDuration: '3-5m',
      dependencies: [steps[1].id],
      parameters: {
        network: 'base_camp_testnet',
        gasLimit: 'estimated'
      }
    });

    // Step 4: Verification
    steps.push({
      id: uuidv4(),
      title: 'Verify Contract',
      description: 'Verify contract on block explorer',
      mcpAgent: 'goat-mcp',
      estimatedDuration: '1-2m',
      dependencies: [steps[2].id],
      parameters: { verify: true }
    });

    return steps;
  }

  private breakdownNFTOperations(parameters: Record<string, any>): TaskStep[] {
    const steps: TaskStep[] = [];

    // Step 1: Validate contract
    steps.push({
      id: uuidv4(),
      title: 'Validate NFT Contract',
      description: 'Check contract ownership and mint permissions',
      mcpAgent: 'goat-mcp',
      estimatedDuration: '30s',
      dependencies: [],
      parameters: {
        contractAddress: parameters.contractAddress,
        checkOwnership: true
      }
    });

    // Step 2: Prepare metadata (if needed)
    if (parameters.metadata) {
      steps.push({
        id: uuidv4(),
        title: 'Prepare Metadata',
        description: 'Upload metadata to IPFS',
        mcpAgent: 'goat-mcp',
        estimatedDuration: '1-2m',
        dependencies: [steps[0].id],
        parameters: {
          metadata: parameters.metadata,
          uploadToIPFS: true
        }
      });
    }

    // Step 3: Execute mint
    steps.push({
      id: uuidv4(),
      title: 'Mint NFT',
      description: `Mint ${parameters.quantity || 1} NFT(s)`,
      mcpAgent: 'goat-mcp',
      estimatedDuration: '2-3m',
      dependencies: parameters.metadata ? [steps[1].id] : [steps[0].id],
      parameters: {
        recipient: parameters.recipient,
        quantity: parameters.quantity || 1
      }
    });

    return steps;
  }

  private breakdownTokenOperations(parameters: Record<string, any>): TaskStep[] {
    const steps: TaskStep[] = [];

    // Step 1: Balance check
    steps.push({
      id: uuidv4(),
      title: 'Check Balance',
      description: 'Verify sufficient token balance',
      mcpAgent: 'goat-mcp',
      estimatedDuration: '10s',
      dependencies: [],
      parameters: {
        token: parameters.token,
        amount: parameters.amount
      }
    });

    // Step 2: Execute transfer
    steps.push({
      id: uuidv4(),
      title: 'Transfer Tokens',
      description: `Send ${parameters.amount} ${parameters.token}`,
      mcpAgent: 'goat-mcp',
      estimatedDuration: '1-2m',
      dependencies: [steps[0].id],
      parameters: {
        recipient: parameters.recipient,
        amount: parameters.amount,
        token: parameters.token
      }
    });

    return steps;
  }

  private breakdownDeFiOperations(parameters: Record<string, any>): TaskStep[] {
    // Placeholder for DeFi operations breakdown
    return this.createGenericBreakdown('defi_operations', parameters);
  }

  private breakdownInformation(parameters: Record<string, any>): TaskStep[] {
    return [{
      id: uuidv4(),
      title: 'Retrieve Information',
      description: 'Fetch requested data',
      mcpAgent: 'research-mcp',
      estimatedDuration: '10-30s',
      dependencies: [],
      parameters
    }];
  }

  private breakdownAutomation(parameters: Record<string, any>): TaskStep[] {
    return [{
      id: uuidv4(),
      title: 'Setup Automation',
      description: 'Configure automated task',
      mcpAgent: 'scheduler-mcp',
      estimatedDuration: '1-2m',
      dependencies: [],
      parameters
    }];
  }

  private createGenericBreakdown(category: string, parameters: Record<string, any>): TaskStep[] {
    return [{
      id: uuidv4(),
      title: `Execute ${category}`,
      description: `Perform ${category} operation`,
      mcpAgent: 'goat-mcp',
      estimatedDuration: '2-5m',
      dependencies: [],
      parameters
    }];
  }

  private async analyzeRequirements(category: string, parameters: Record<string, any>): Promise<string[]> {
    const requirements: string[] = [];

    // Network requirements
    const networks = this.getNetworkRequirements(category);
    requirements.push(...networks.map(n => `Network: ${n}`));

    // Permission requirements
    if (category === 'contract_deployment') {
      requirements.push('Contract deployment permission');
      requirements.push('Gas spending permission');
    }

    if (category === 'nft_operations') {
      requirements.push('NFT minting permission');
      requirements.push('Contract ownership verification');
    }

    if (category === 'token_operations') {
      requirements.push('Token transfer permission');
      requirements.push('Sufficient token balance');
    }

    return requirements;
  }

  private async assessRisks(category: string, parameters: Record<string, any>, breakdown: TaskStep[]): Promise<string[]> {
    const risks: string[] = [];

    // Network risks
    if (this.getNetworkRequirements(category).length > 0) {
      risks.push('Network congestion may cause delays');
      risks.push('Gas price fluctuations');
    }

    // Operation-specific risks
    if (category === 'contract_deployment') {
      risks.push('Contract deployment failure');
      risks.push('Smart contract vulnerabilities');
    }

    if (category === 'token_operations') {
      risks.push('Insufficient gas for transaction');
      risks.push('Invalid recipient address');
    }

    // Multi-step operation risks
    if (breakdown.length > 1) {
      risks.push('Partial execution if steps fail');
    }

    return risks;
  }

  private async estimateCosts(category: string, breakdown: TaskStep[]): Promise<number> {
    const baseCosts: Record<string, number> = {
      'contract_deployment': 0.05, // CAMP tokens
      'nft_operations': 0.001,
      'token_operations': 0.0005,
      'defi_operations': 0.002,
      'information': 0,
      'automation': 0.0001
    };

    const baseCost = baseCosts[category] || 0.001;
    
    // Add complexity multiplier based on steps
    const complexityMultiplier = 1 + (breakdown.length - 1) * 0.2;
    
    return baseCost * complexityMultiplier;
  }

  private getNetworkRequirements(category: string): string[] {
    const networkMap: Record<string, string[]> = {
      'contract_deployment': ['base_camp_testnet'],
      'nft_operations': ['base_camp_testnet'],
      'token_operations': ['base_camp_testnet'],
      'defi_operations': ['base_camp_testnet'],
      'information': [],
      'automation': []
    };

    return networkMap[category] || [];
  }

  private assessSecurityLevel(category: string, parameters: Record<string, any>): 'low' | 'medium' | 'high' {
    if (category === 'contract_deployment') return 'high';
    if (category === 'token_operations' && parameters.amount > 1) return 'medium';
    if (category === 'nft_operations') return 'medium';
    if (category === 'information') return 'low';
    
    return 'medium';
  }

  private requiresApproval(category: string, parameters: Record<string, any>, estimatedCost: number): boolean {
    // High-cost operations require approval
    if (estimatedCost > 0.01) return true;
    
    // High-security operations require approval
    if (this.assessSecurityLevel(category, parameters) === 'high') return true;
    
    // Large token transfers require approval
    if (category === 'token_operations' && parameters.amount > 10) return true;
    
    return false;
  }

  private validateParameters(category: string, parameters: Record<string, any>): boolean {
    const requiredParams: Record<string, string[]> = {
      'contract_deployment': ['contractType'],
      'nft_operations': ['quantity'],
      'token_operations': ['amount', 'recipient'],
      'defi_operations': ['amount'],
      'information': [],
      'automation': ['schedule']
    };

    const required = requiredParams[category] || [];
    return required.every(param => parameters[param] !== undefined);
  }

  private initializeNetworkMonitoring(): void {
    // Mock network status - in production, this would ping actual networks
    this.networkStatus.set('base_camp_testnet', true);
    this.networkStatus.set('ethereum', true);
    this.networkStatus.set('polygon', true);

    // Periodic network health checks
    setInterval(() => {
      this.updateNetworkStatus();
    }, 30000); // Every 30 seconds
  }

  private updateNetworkStatus(): void {
    // Mock implementation - would use actual network checks
    this.logActivity('Updated network status');
  }

  private createErrorResponse(originalMessage: AgentMessage, error: string): AgentMessage {
    return {
      type: 'error_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: originalMessage.senderId,
      payload: {
        error,
        originalMessageId: originalMessage.id
      }
    };
  }
}