// Agent System API Routes
import express from 'express';
import { AgentSystem } from './agents';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
let agentSystem: AgentSystem;

// Initialize agent system
export function initializeAgentSystem() {
  if (!agentSystem) {
    agentSystem = new AgentSystem();
    console.log('Agent system initialized');
  }
  return agentSystem;
}

// Chat endpoint - main interaction with the companion
router.post('/chat', async (req, res) => {
  try {
    const { message, userId, conversationId = uuidv4() } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({ error: 'Missing message or userId' });
    }

    const response = await agentSystem.processUserMessage(userId, message, conversationId);
    
    res.json({
      success: true,
      response: response.response,
      taskCreated: response.taskCreated,
      taskId: response.taskId,
      conversationId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await agentSystem.getUserProfile(userId);
    
    res.json({ profile });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get user tasks
router.get('/tasks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await agentSystem.getAllActiveTasks(userId);
    
    res.json({ tasks });
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Get task status
router.get('/task/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const status = await agentSystem.getTaskStatus(taskId);
    
    res.json({ status });
  } catch (error) {
    console.error('Task status error:', error);
    res.status(500).json({ error: 'Failed to get task status' });
  }
});

// WebSocket setup for real-time updates
export function setupAgentWebSocket(io: any) {
  io.on('connection', (socket: any) => {
    console.log('User connected to agent system:', socket.id);
    
    socket.on('register_user', (userId: string) => {
      socket.userId = userId;
      socket.join(`user_${userId}`);
      console.log(`User ${userId} registered for real-time updates`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from agent system:', socket.id);
    });
  });
}

export { router as agentRoutes };
export { agentSystem };