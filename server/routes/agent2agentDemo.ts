// Agent2Agent Protocol Integration - Uses actual multi-agent system
import { Router } from 'express';
import { AgentSystem } from '../agents';

const router = Router();

// Instead of hard-coded demos, route through the actual Agent2Agent protocol
router.post('/demo/agent2agent', async (req, res) => {
  try {
    const { request } = req.body;
    
    if (!request) {
      return res.status(400).json({
        success: false,
        error: 'Request parameter required for Agent2Agent demonstration'
      });
    }

    // Route through the actual multi-agent system instead of hard-coded responses
    const agentSystem = AgentSystem.getInstance();
    const companionHandler = agentSystem.getAgent('companion-handler');
    
    if (!companionHandler) {
      throw new Error('CompanionHandler agent not available');
    }

    // Create a demonstration request that goes through the actual Agent2Agent protocol
    const demoRequest = {
      message: `DEMO: ${request}`,
      context: {
        isDemonstration: true,
        showProtocolDetails: true,
        requestType: 'agent2agent_demo'
      }
    };

    const response = await companionHandler.processRequest(demoRequest);

    res.json({
      success: true,
      message: 'Agent2Agent protocol executed through actual multi-agent system',
      response,
      metadata: {
        systemUsed: 'live_agent2agent_protocol',
        agentsInvolved: response.agentsInvolved || ['companion-handler'],
        executionTime: response.executionTime || 'N/A'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Agent2Agent demo failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      note: 'This uses the actual Agent2Agent protocol, not hard-coded responses',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;