// Agent2Agent Protocol Demo Routes
import { Router } from 'express';
import { runAgent2AgentDemo } from '../agents/demo/Agent2AgentDemo';

const router = Router();

// Demo route for Agent2Agent protocol
router.post('/demo/agent2agent', async (req, res) => {
  try {
    console.log('\n🚀 Starting Agent2Agent Protocol Demo...\n');
    
    // Capture console output for response
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: any[]) => {
      const message = args.join(' ');
      logs.push(message);
      originalLog(message);
    };

    // Run the demonstration
    await runAgent2AgentDemo();

    // Restore console.log
    console.log = originalLog;

    res.json({
      success: true,
      message: 'Agent2Agent protocol demonstration completed successfully',
      logs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Agent2Agent demo failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get protocol statistics
router.get('/demo/agent2agent/stats', async (req, res) => {
  try {
    // This would typically access the actual protocol instance
    const mockStats = {
      totalAgents: 15,
      mcpAgents: 6,
      activeNegotiations: 0,
      completedTasks: 0,
      averageConfidence: 0.85,
      pluginCount: 5,
      supportedCapabilities: [
        'smart_contract_generation',
        'nft_operations', 
        'defi_protocols',
        'cross_chain_bridges',
        'yield_farming',
        'token_swaps',
        'documentation_generation',
        'security_analysis',
        'market_research'
      ]
    };

    res.json({
      success: true,
      stats: mockStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Capability matching demo
router.post('/demo/capability-matching', async (req, res) => {
  try {
    const { request } = req.body;
    
    if (!request) {
      return res.status(400).json({
        success: false,
        error: 'Request parameter required'
      });
    }

    // Simulate capability matching
    const capabilityMappings: Record<string, string[]> = {
      'create nft': ['goat-mcp', 'codegen-mcp'],
      'swap tokens': ['goat-mcp', 'research-mcp'],
      'generate contract': ['codegen-mcp', 'docwriter-mcp'],
      'analyze defi': ['research-mcp', 'goat-mcp'],
      'bridge assets': ['goat-mcp', 'scheduler-mcp'],
      'yield farming': ['goat-mcp', 'research-mcp', 'scheduler-mcp']
    };

    const normalizedRequest = request.toLowerCase();
    const matchingKey = Object.keys(capabilityMappings).find(key => 
      normalizedRequest.includes(key)
    );

    const matchedAgents = matchingKey ? capabilityMappings[matchingKey] : [];
    
    res.json({
      success: true,
      request,
      matchedAgents,
      confidence: matchedAgents.length > 0 ? 0.9 : 0.1,
      reasoning: matchedAgents.length > 0 
        ? `Found ${matchedAgents.length} specialized agents for this task`
        : 'No direct capability match found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;