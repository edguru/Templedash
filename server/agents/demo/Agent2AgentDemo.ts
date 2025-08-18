// Agent2Agent Protocol Demonstration
import { Agent2AgentProtocol } from '../core/Agent2AgentProtocol';
import { CapabilityRegistry } from '../core/CapabilityRegistry';
import { CapabilityMapper } from '../core/CapabilityMapper';
import { MessageBroker } from '../core/MessageBroker';

export class Agent2AgentDemo {
  private protocol: Agent2AgentProtocol;
  private capabilityRegistry: CapabilityRegistry;
  private messageBroker: MessageBroker;

  constructor() {
    this.messageBroker = new MessageBroker();
    this.capabilityRegistry = new CapabilityRegistry();
    const capabilityMapper = new CapabilityMapper();
    this.protocol = new Agent2AgentProtocol(
      this.messageBroker,
      this.capabilityRegistry,
      capabilityMapper
    );
  }

  async demonstrateTaskDelegation(): Promise<void> {
    console.log('\n🚀 Agent2Agent Protocol Demonstration');
    console.log('=====================================\n');

    // Demo 1: NFT Minting Task
    console.log('📝 Demo 1: NFT Minting Task Delegation');
    const nftTask = {
      taskType: 'nft_mint',
      requiredCapabilities: ['smart_contract_interaction', 'nft_operations', 'blockchain_transactions'],
      securityLevel: 'high',
      maxLatency: 60000,
      context: {
        userAddress: '0x1234...5678',
        contractAddress: '0x742d35Cc6e2C3e312318508CF3c66E2E2B45A1b5',
        tokenMetadata: { name: 'Demo NFT', description: 'Agent2Agent Demo' }
      }
    };

    try {
      const negotiation = await this.protocol.delegateTask('companion-handler', nftTask);
      console.log(`✅ Task delegated to: ${negotiation.selectedAgent}`);
      console.log(`📋 Reasoning: ${negotiation.reasoning}`);
      console.log(`🔄 Negotiation rounds: ${negotiation.negotiationRounds.length}`);
    } catch (error) {
      console.log(`❌ Delegation failed: ${error.message}`);
    }

    // Demo 2: Code Generation with Collaboration
    console.log('\n📝 Demo 2: Smart Contract Generation with Peer Consultation');
    const codeGenTask = {
      taskType: 'smart_contract_generation',
      requiredCapabilities: ['solidity_development', 'security_analysis', 'contract_optimization'],
      securityLevel: 'high',
      maxLatency: 120000,
      context: {
        contractType: 'ERC721',
        features: ['mintable', 'pausable', 'burnable'],
        network: 'base_camp_testnet'
      }
    };

    try {
      const collaboration = await this.protocol.executeCollaborativeTask(
        'codegen-mcp',
        ['research-mcp', 'docwriter-mcp'],
        codeGenTask
      );
      console.log(`✅ Primary agent: ${collaboration.primaryAgent}`);
      console.log(`🤝 Consulting agents: ${collaboration.consultingAgents.join(', ')}`);
      console.log(`📊 Confidence: ${(collaboration.confidence * 100).toFixed(1)}%`);
      console.log(`📋 Result: ${collaboration.synthesizedResult.summary}`);
    } catch (error) {
      console.log(`❌ Collaboration failed: ${error.message}`);
    }

    // Demo 3: Multi-Agent Research Task
    console.log('\n📝 Demo 3: DeFi Protocol Research with Agent Negotiation');
    const researchTask = {
      taskType: 'defi_analysis',
      requiredCapabilities: ['market_research', 'protocol_analysis', 'risk_assessment'],
      securityLevel: 'medium',
      maxLatency: 90000,
      context: {
        protocols: ['Uniswap', 'Compound', 'Aave'],
        analysisType: 'yield_opportunities',
        riskTolerance: 'moderate'
      }
    };

    try {
      const negotiation = await this.protocol.delegateTask('user-experience', researchTask);
      console.log(`✅ Research delegated to: ${negotiation.selectedAgent}`);
      console.log(`📊 Candidate agents evaluated: ${negotiation.candidates.length}`);
      console.log(`🔄 Negotiation rounds: ${negotiation.negotiationRounds.length}`);
      
      // Show negotiation details
      const lastRound = negotiation.negotiationRounds[negotiation.negotiationRounds.length - 1];
      console.log(`💰 Bids received: ${lastRound.bids.length}`);
      console.log(`🤝 Peer consultations: ${lastRound.consultations.length}`);
    } catch (error) {
      console.log(`❌ Research delegation failed: ${error.message}`);
    }

    // Protocol Statistics
    console.log('\n📈 Protocol Statistics');
    const stats = this.protocol.getProtocolStats();
    console.log(`Active negotiations: ${stats.activeNegotiations}`);
    console.log(`Completed collaborations: ${stats.completedCollaborations}`);
    console.log(`Average confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);

    console.log('\n✨ Agent2Agent Protocol demonstration completed!\n');
  }

  async demonstrateCapabilityMatching(): Promise<void> {
    console.log('🎯 Capability Matching Demonstration');
    console.log('===================================\n');

    const testCapabilities = [
      'Create a new ERC20 token',
      'Check my wallet balance', 
      'Generate smart contract documentation',
      'Schedule recurring DeFi yield farming',
      'Analyze gas optimization opportunities'
    ];

    for (const capability of testCapabilities) {
      console.log(`🔍 Request: "${capability}"`);
      
      const taskReq = {
        taskType: 'general_request',
        requiredCapabilities: [capability.toLowerCase().replace(/\s+/g, '_')],
        securityLevel: 'medium',
        context: { userRequest: capability }
      };

      const matches = this.capabilityRegistry.findBestAgentsForTask(taskReq);
      
      if (matches.length > 0) {
        const bestMatch = matches[0];
        console.log(`✅ Best match: ${bestMatch.agentId} (score: ${bestMatch.score.toFixed(2)})`);
        console.log(`📋 Reasoning: ${bestMatch.reasoning}`);
      } else {
        console.log(`❌ No suitable agents found`);
      }
      console.log('');
    }
  }
}

// Export for easy testing
export async function runAgent2AgentDemo(): Promise<void> {
  const demo = new Agent2AgentDemo();
  await demo.demonstrateTaskDelegation();
  await demo.demonstrateCapabilityMatching();
}