// Agent2Agent Protocol Implementation - Google-inspired intelligent task delegation
import { BaseAgent } from './BaseAgent';
import { MessageBroker } from './MessageBroker';
import { CapabilityRegistry } from './CapabilityRegistry';
import { CapabilityMapper } from './CapabilityMapper';
import { AgentMessage, TaskRequirement, AgentCapabilityMatch } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

export interface Agent2AgentNegotiation {
  taskId: string;
  requestingAgent: string;
  candidates: AgentCapabilityMatch[];
  negotiationRounds: NegotiationRound[];
  selectedAgent?: string;
  reasoning: string;
  timestamp: Date;
}

export interface NegotiationRound {
  round: number;
  bids: AgentBid[];
  consultations: AgentConsultation[];
  timestamp: Date;
}

export interface AgentBid {
  agentId: string;
  confidence: number;
  estimatedCost: number;
  estimatedTime: number;
  specializations: string[];
  reasoning: string;
}

export interface AgentConsultation {
  consultingAgent: string;
  consultedAgent: string;
  expertise: string;
  recommendation: string;
  confidence: number;
}

export interface CollaborativeResponse {
  primaryAgent: string;
  consultingAgents: string[];
  synthesizedResult: any;
  contributionBreakdown: Record<string, any>;
  confidence: number;
}

export class Agent2AgentProtocol {
  private messageBroker: MessageBroker;
  private capabilityRegistry: CapabilityRegistry;
  private capabilityMapper: CapabilityMapper;
  private activeNegotiations: Map<string, Agent2AgentNegotiation> = new Map();
  private collaborationHistory: Map<string, CollaborativeResponse[]> = new Map();

  constructor(
    messageBroker: MessageBroker,
    capabilityRegistry: CapabilityRegistry,
    capabilityMapper: CapabilityMapper
  ) {
    this.messageBroker = messageBroker;
    this.capabilityRegistry = capabilityRegistry;
    this.capabilityMapper = capabilityMapper;
  }

  /**
   * Initiate intelligent task delegation using Agent2Agent protocol
   */
  async delegateTask(
    requestingAgent: string,
    taskRequirement: TaskRequirement
  ): Promise<Agent2AgentNegotiation> {
    const taskId = uuidv4();
    
    console.log(`[Agent2Agent] Starting task delegation for ${taskRequirement.taskType}`);

    // Phase 1: Capability-based candidate identification
    const candidates = this.capabilityRegistry.findBestAgentsForTask(taskRequirement);
    
    if (candidates.length === 0) {
      throw new Error(`No suitable agents found for task: ${taskRequirement.taskType}`);
    }

    // Phase 2: Agent negotiation and bidding
    const negotiation: Agent2AgentNegotiation = {
      taskId,
      requestingAgent,
      candidates,
      negotiationRounds: [],
      reasoning: 'Initial capability matching completed',
      timestamp: new Date()
    };

    // Conduct negotiation rounds
    await this.conductNegotiation(negotiation, taskRequirement);

    this.activeNegotiations.set(taskId, negotiation);
    return negotiation;
  }

  /**
   * Conduct multi-round negotiation between candidate agents
   */
  private async conductNegotiation(
    negotiation: Agent2AgentNegotiation,
    taskRequirement: TaskRequirement
  ): Promise<void> {
    const maxRounds = 3;

    for (let round = 1; round <= maxRounds; round++) {
      console.log(`[Agent2Agent] Negotiation round ${round} for task ${negotiation.taskId}`);

      const negotiationRound: NegotiationRound = {
        round,
        bids: [],
        consultations: [],
        timestamp: new Date()
      };

      // Collect bids from candidate agents
      for (const candidate of negotiation.candidates.slice(0, 5)) { // Top 5 candidates
        try {
          const bid = await this.requestBid(candidate.agentId, taskRequirement, round);
          if (bid) {
            negotiationRound.bids.push(bid);
          }
        } catch (error) {
          console.warn(`[Agent2Agent] Failed to get bid from ${candidate.agentId}:`, error);
        }
      }

      // Conduct peer consultations
      if (round > 1) {
        const consultations = await this.conductPeerConsultations(
          negotiationRound.bids,
          taskRequirement
        );
        negotiationRound.consultations = consultations;
      }

      negotiation.negotiationRounds.push(negotiationRound);

      // Check for convergence or select best agent
      const selectedAgent = this.evaluateBids(negotiationRound.bids, taskRequirement);
      if (selectedAgent) {
        negotiation.selectedAgent = selectedAgent.agentId;
        negotiation.reasoning = `Selected ${selectedAgent.agentId} after ${round} rounds. ${selectedAgent.reasoning}`;
        break;
      }
    }

    // Fallback selection if no convergence
    if (!negotiation.selectedAgent && negotiation.negotiationRounds.length > 0) {
      const lastRound = negotiation.negotiationRounds[negotiation.negotiationRounds.length - 1];
      const bestBid = this.selectBestBid(lastRound.bids);
      if (bestBid) {
        negotiation.selectedAgent = bestBid.agentId;
        negotiation.reasoning = `Fallback selection: ${bestBid.agentId} (${bestBid.reasoning})`;
      }
    }
  }

  /**
   * Request bid from a specific agent
   */
  private async requestBid(
    agentId: string,
    taskRequirement: TaskRequirement,
    round: number
  ): Promise<AgentBid | null> {
    try {
      const bidRequest: AgentMessage = {
        type: 'bid_request',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: 'agent2agent-protocol',
        targetId: agentId,
        payload: {
          taskRequirement,
          round,
          requestType: 'capability_bid'
        }
      };

      // Simulate bid response (in real implementation, this would be async)
      const capabilities = this.capabilityMapper.getAgentCapabilities(agentId) || [];
      const relevantCapabilities = capabilities.filter(cap =>
        taskRequirement.requiredCapabilities.some(req => 
          cap.toLowerCase().includes(req.toLowerCase())
        )
      );

      const bid: AgentBid = {
        agentId,
        confidence: Math.min(0.95, 0.6 + (relevantCapabilities.length * 0.1)),
        estimatedCost: 0.3 + Math.random() * 0.4,
        estimatedTime: 30 + Math.random() * 60,
        specializations: relevantCapabilities,
        reasoning: `Agent specializes in: ${relevantCapabilities.join(', ')}`
      };

      console.log(`[Agent2Agent] Received bid from ${agentId}: confidence=${bid.confidence.toFixed(2)}`);
      return bid;
    } catch (error) {
      console.error(`[Agent2Agent] Failed to request bid from ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Conduct peer consultations for collaborative insights
   */
  private async conductPeerConsultations(
    bids: AgentBid[],
    taskRequirement: TaskRequirement
  ): Promise<AgentConsultation[]> {
    const consultations: AgentConsultation[] = [];

    // Select top 3 bidders for cross-consultation
    const topBidders = bids
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    for (let i = 0; i < topBidders.length; i++) {
      for (let j = 0; j < topBidders.length; j++) {
        if (i !== j) {
          const consultation = await this.requestConsultation(
            topBidders[i].agentId,
            topBidders[j].agentId,
            taskRequirement
          );
          if (consultation) {
            consultations.push(consultation);
          }
        }
      }
    }

    console.log(`[Agent2Agent] Completed ${consultations.length} peer consultations`);
    return consultations;
  }

  /**
   * Request consultation between two agents
   */
  private async requestConsultation(
    consultingAgent: string,
    consultedAgent: string,
    taskRequirement: TaskRequirement
  ): Promise<AgentConsultation | null> {
    try {
      // Simulate consultation (in real implementation, this would involve actual agent communication)
      const consultingCapabilities = this.capabilityMapper.getAgentCapabilities(consultingAgent) || [];
      const consultedCapabilities = this.capabilityMapper.getAgentCapabilities(consultedAgent) || [];

      const sharedExpertise = consultingCapabilities.filter(cap =>
        consultedCapabilities.includes(cap)
      );

      const consultation: AgentConsultation = {
        consultingAgent,
        consultedAgent,
        expertise: sharedExpertise.join(', ') || 'General collaboration',
        recommendation: `${consultedAgent} has complementary strengths in ${consultedCapabilities.slice(0, 2).join(', ')}`,
        confidence: sharedExpertise.length > 0 ? 0.8 : 0.5
      };

      return consultation;
    } catch (error) {
      console.error(`[Agent2Agent] Consultation failed between ${consultingAgent} and ${consultedAgent}:`, error);
      return null;
    }
  }

  /**
   * Evaluate bids and select optimal agent
   */
  private evaluateBids(bids: AgentBid[], taskRequirement: TaskRequirement): AgentBid | null {
    if (bids.length === 0) return null;

    // Multi-criteria evaluation
    const evaluatedBids = bids.map(bid => {
      const confidenceScore = bid.confidence * 0.4;
      const costScore = (1 - bid.estimatedCost) * 0.2;
      const timeScore = Math.max(0, 1 - (bid.estimatedTime / 120)) * 0.2;
      const specializationScore = Math.min(1, bid.specializations.length / 5) * 0.2;

      const totalScore = confidenceScore + costScore + timeScore + specializationScore;

      return {
        ...bid,
        totalScore,
        reasoning: `Confidence: ${(confidenceScore*100).toFixed(1)}%, Cost efficiency: ${(costScore*100).toFixed(1)}%, Time efficiency: ${(timeScore*100).toFixed(1)}%, Specialization: ${(specializationScore*100).toFixed(1)}%`
      };
    });

    // Select highest scoring bid above threshold
    const bestBid = evaluatedBids
      .filter(bid => bid.totalScore > 0.6) // Minimum quality threshold
      .sort((a, b) => b.totalScore - a.totalScore)[0];

    return bestBid || null;
  }

  /**
   * Select best bid as fallback
   */
  private selectBestBid(bids: AgentBid[]): AgentBid | null {
    if (bids.length === 0) return null;
    
    return bids.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }

  /**
   * Execute collaborative task with multiple agents
   */
  async executeCollaborativeTask(
    primaryAgentId: string,
    consultingAgentIds: string[],
    taskRequirement: TaskRequirement
  ): Promise<CollaborativeResponse> {
    const collaborationId = uuidv4();
    
    console.log(`[Agent2Agent] Starting collaborative execution: ${primaryAgentId} + ${consultingAgentIds.length} consultants`);

    const response: CollaborativeResponse = {
      primaryAgent: primaryAgentId,
      consultingAgents: consultingAgentIds,
      synthesizedResult: {},
      contributionBreakdown: {},
      confidence: 0
    };

    try {
      // Execute primary task
      const primaryResult = await this.executeAgentTask(primaryAgentId, taskRequirement);
      response.contributionBreakdown[primaryAgentId] = primaryResult;

      // Gather consultations
      const consultationResults: Record<string, any> = {};
      for (const consultantId of consultingAgentIds) {
        try {
          const consultationResult = await this.executeAgentTask(consultantId, {
            ...taskRequirement,
            taskType: `consult_on_${taskRequirement.taskType}`
          });
          consultationResults[consultantId] = consultationResult;
        } catch (error) {
          console.warn(`[Agent2Agent] Consultation failed for ${consultantId}:`, error);
        }
      }

      response.contributionBreakdown = { ...response.contributionBreakdown, ...consultationResults };

      // Synthesize results
      response.synthesizedResult = this.synthesizeResults(primaryResult, consultationResults);
      response.confidence = this.calculateCollaborationConfidence(response.contributionBreakdown);

      // Store collaboration history
      const agentHistory = this.collaborationHistory.get(primaryAgentId) || [];
      agentHistory.push(response);
      this.collaborationHistory.set(primaryAgentId, agentHistory);

      console.log(`[Agent2Agent] Collaboration completed with confidence: ${response.confidence.toFixed(2)}`);
      return response;
    } catch (error) {
      console.error(`[Agent2Agent] Collaborative execution failed:`, error);
      throw error;
    }
  }

  /**
   * Execute task on specific agent
   */
  private async executeAgentTask(agentId: string, taskRequirement: TaskRequirement): Promise<any> {
    // This would typically send a message to the agent and await response
    // For now, return a simulated result
    return {
      agentId,
      taskType: taskRequirement.taskType,
      result: `Task executed by ${agentId}`,
      confidence: 0.8,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Synthesize results from multiple agents
   */
  private synthesizeResults(primaryResult: any, consultationResults: Record<string, any>): any {
    const synthesis = {
      primary: primaryResult,
      consultations: consultationResults,
      summary: `Primary execution by ${primaryResult.agentId} with ${Object.keys(consultationResults).length} consultations`,
      confidence: this.calculateSynthesisConfidence(primaryResult, consultationResults),
      timestamp: new Date().toISOString()
    };

    return synthesis;
  }

  /**
   * Calculate confidence for synthesized results
   */
  private calculateSynthesisConfidence(primaryResult: any, consultationResults: Record<string, any>): number {
    const primaryConfidence = primaryResult.confidence || 0.5;
    const consultationConfidences = Object.values(consultationResults)
      .map((result: any) => result.confidence || 0.5);

    const avgConsultationConfidence = consultationConfidences.length > 0
      ? consultationConfidences.reduce((sum, conf) => sum + conf, 0) / consultationConfidences.length
      : 0.5;

    // Weighted synthesis: 70% primary, 30% consultations
    return (primaryConfidence * 0.7) + (avgConsultationConfidence * 0.3);
  }

  /**
   * Calculate overall collaboration confidence
   */
  private calculateCollaborationConfidence(contributionBreakdown: Record<string, any>): number {
    const contributions = Object.values(contributionBreakdown);
    if (contributions.length === 0) return 0;

    const confidences = contributions.map((contrib: any) => contrib.confidence || 0.5);
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  /**
   * Get negotiation status
   */
  getNegotiation(taskId: string): Agent2AgentNegotiation | undefined {
    return this.activeNegotiations.get(taskId);
  }

  /**
   * Get collaboration history
   */
  getCollaborationHistory(agentId: string): CollaborativeResponse[] {
    return this.collaborationHistory.get(agentId) || [];
  }

  /**
   * Get protocol statistics
   */
  getProtocolStats(): {
    activeNegotiations: number;
    completedCollaborations: number;
    averageConfidence: number;
  } {
    const collaborations = Array.from(this.collaborationHistory.values()).flat();
    const averageConfidence = collaborations.length > 0
      ? collaborations.reduce((sum, collab) => sum + collab.confidence, 0) / collaborations.length
      : 0;

    return {
      activeNegotiations: this.activeNegotiations.size,
      completedCollaborations: collaborations.length,
      averageConfidence
    };
  }
}