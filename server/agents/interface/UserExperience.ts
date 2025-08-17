// User Experience Agent - Main interface, collecting feedback and managing interactions
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

interface UserSession {
  userId: string;
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  interactions: number;
  satisfaction: number | null;
  activeConversations: Set<string>;
}

interface UserFeedback {
  userId: string;
  sessionId: string;
  type: 'rating' | 'comment' | 'bug_report' | 'feature_request';
  content: string;
  rating?: number;
  timestamp: Date;
}

interface UIUpdate {
  userId: string;
  type: 'message' | 'task_update' | 'notification' | 'status_change';
  content: any;
  priority: 'low' | 'medium' | 'high';
}

export class UserExperience extends BaseAgent {
  private activeSessions: Map<string, UserSession> = new Map();
  private userFeedback: UserFeedback[] = [];
  private uiUpdateQueue: Map<string, UIUpdate[]> = new Map();
  private websocketConnections: Map<string, any> = new Map(); // WebSocket connections per user

  constructor(messageBroker: MessageBroker) {
    super('user-experience', messageBroker);
  }

  protected initialize(): void {
    this.logActivity('Initializing User Experience Agent');
    
    // Subscribe to UI updates
    this.messageBroker.subscribe('companion_response', async (message: AgentMessage) => {
      await this.handleCompanionResponse(message);
    });

    this.messageBroker.subscribe('task_state_changed', async (message: AgentMessage) => {
      await this.handleTaskStateChange(message);
    });

    this.messageBroker.subscribe('task_notification', async (message: AgentMessage) => {
      await this.handleTaskNotification(message);
    });

    // Start periodic session cleanup
    this.startSessionManagement();
  }

  getCapabilities(): string[] {
    return [
      'user_interface_management',
      'real_time_updates',
      'feedback_collection',
      'session_tracking',
      'notification_delivery',
      'user_engagement_analysis'
    ];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      this.logActivity('Handling message', { type: message.type });

      switch (message.type) {
        case 'start_session':
          return await this.startUserSession(message.payload);
          
        case 'end_session':
          await this.endUserSession(message.payload.userId, message.payload.sessionId);
          break;
          
        case 'submit_feedback':
          await this.collectFeedback(message.payload);
          break;
          
        case 'get_ui_updates':
          return await this.getUIUpdates(message.payload.userId);
          
        case 'register_websocket':
          await this.registerWebSocket(message.payload.userId, message.payload.connection);
          break;
      }

      return null;
    } catch (error) {
      console.error('[UserExperience] Error handling message:', error);
      return this.createErrorResponse(message, 'Failed to process UX request');
    }
  }

  async startUserSession(payload: any): Promise<AgentMessage> {
    const { userId } = payload;
    const sessionId = uuidv4();
    
    const session: UserSession = {
      userId,
      sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      interactions: 0,
      satisfaction: null,
      activeConversations: new Set()
    };

    this.activeSessions.set(userId, session);
    
    this.logActivity('Started user session', { userId, sessionId });

    return {
      type: 'session_started',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      payload: {
        userId,
        sessionId,
        welcomeMessage: await this.generateWelcomeMessage(userId)
      }
    };
  }

  async endUserSession(userId: string, sessionId: string): Promise<void> {
    const session = this.activeSessions.get(userId);
    
    if (session && session.sessionId === sessionId) {
      // Calculate session metrics
      const duration = new Date().getTime() - session.startTime.getTime();
      const sessionData = {
        ...session,
        endTime: new Date(),
        duration
      };

      // Store session for analytics
      this.storeSessionData(sessionData);
      
      // Clean up
      this.activeSessions.delete(userId);
      this.websocketConnections.delete(userId);
      
      this.logActivity('Ended user session', { userId, sessionId, duration });
    }
  }

  async collectFeedback(payload: any): Promise<void> {
    const feedback: UserFeedback = {
      userId: payload.userId,
      sessionId: payload.sessionId || 'unknown',
      type: payload.type,
      content: payload.content,
      rating: payload.rating,
      timestamp: new Date()
    };

    this.userFeedback.push(feedback);
    
    // Update session satisfaction if rating provided
    if (feedback.rating && this.activeSessions.has(feedback.userId)) {
      const session = this.activeSessions.get(feedback.userId)!;
      session.satisfaction = feedback.rating;
    }

    this.logActivity('Collected user feedback', { 
      userId: feedback.userId, 
      type: feedback.type, 
      rating: feedback.rating 
    });

    // Process feedback for immediate improvements
    await this.processFeedback(feedback);
  }

  private async handleCompanionResponse(message: AgentMessage): Promise<void> {
    const { userId, response, conversationId } = message.payload;
    
    // Create UI update for companion response
    const uiUpdate: UIUpdate = {
      userId,
      type: 'message',
      content: {
        type: 'companion_message',
        message: response,
        conversationId,
        timestamp: message.timestamp
      },
      priority: 'medium'
    };

    await this.queueUIUpdate(userId, uiUpdate);
    await this.sendRealTimeUpdate(userId, uiUpdate);

    // Update session activity
    this.updateSessionActivity(userId);
  }

  private async handleTaskStateChange(message: AgentMessage): Promise<void> {
    const { userId, taskId, oldState, newState, task } = message.payload;
    
    const uiUpdate: UIUpdate = {
      userId,
      type: 'task_update',
      content: {
        taskId,
        oldState,
        newState,
        task,
        timestamp: message.timestamp
      },
      priority: this.getTaskUpdatePriority(newState)
    };

    await this.queueUIUpdate(userId, uiUpdate);
    await this.sendRealTimeUpdate(userId, uiUpdate);

    // Send notification for important state changes
    if (['COMPLETED', 'FAILED', 'AWAITING_SIGN'].includes(newState)) {
      await this.sendTaskNotification(userId, taskId, newState, task);
    }
  }

  private async handleTaskNotification(message: AgentMessage): Promise<void> {
    const { userId, type, message: notificationMessage, taskId } = message.payload;
    
    const uiUpdate: UIUpdate = {
      userId,
      type: 'notification',
      content: {
        type,
        message: notificationMessage,
        taskId,
        timestamp: message.timestamp
      },
      priority: 'high'
    };

    await this.queueUIUpdate(userId, uiUpdate);
    await this.sendRealTimeUpdate(userId, uiUpdate);
  }

  private async queueUIUpdate(userId: string, update: UIUpdate): Promise<void> {
    if (!this.uiUpdateQueue.has(userId)) {
      this.uiUpdateQueue.set(userId, []);
    }
    
    const queue = this.uiUpdateQueue.get(userId)!;
    queue.push(update);
    
    // Keep queue size limited
    if (queue.length > 50) {
      queue.splice(0, queue.length - 50);
    }
  }

  private async sendRealTimeUpdate(userId: string, update: UIUpdate): Promise<void> {
    const connection = this.websocketConnections.get(userId);
    
    if (connection && connection.readyState === 1) { // WebSocket.OPEN
      try {
        connection.send(JSON.stringify({
          type: 'ui_update',
          data: update
        }));
        
        this.logActivity('Sent real-time update', { userId, updateType: update.type });
      } catch (error) {
        console.error(`[UserExperience] Failed to send real-time update to ${userId}:`, error);
        this.websocketConnections.delete(userId);
      }
    }
  }

  private async sendTaskNotification(userId: string, taskId: string, state: string, task: any): Promise<void> {
    const notifications = {
      'COMPLETED': `✅ Task completed: ${task.title}`,
      'FAILED': `❌ Task failed: ${task.title}`,
      'AWAITING_SIGN': `🔐 Please sign transaction for: ${task.title}`
    };

    const message = notifications[state as keyof typeof notifications] || `Task ${taskId} is now ${state}`;
    
    const notification: UIUpdate = {
      userId,
      type: 'notification',
      content: {
        title: 'Task Update',
        message,
        taskId,
        action: state === 'AWAITING_SIGN' ? 'sign_transaction' : null,
        timestamp: new Date().toISOString()
      },
      priority: 'high'
    };

    await this.sendRealTimeUpdate(userId, notification);
  }

  private async getUIUpdates(userId: string): Promise<AgentMessage> {
    const updates = this.uiUpdateQueue.get(userId) || [];
    
    // Clear queue after retrieval
    this.uiUpdateQueue.set(userId, []);

    return {
      type: 'ui_updates_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      payload: {
        userId,
        updates,
        count: updates.length
      }
    };
  }

  private async registerWebSocket(userId: string, connection: any): Promise<void> {
    this.websocketConnections.set(userId, connection);
    
    // Send queued updates immediately
    const queuedUpdates = this.uiUpdateQueue.get(userId) || [];
    for (const update of queuedUpdates) {
      await this.sendRealTimeUpdate(userId, update);
    }
    
    this.uiUpdateQueue.set(userId, []); // Clear queue
    
    this.logActivity('Registered WebSocket connection', { userId });
  }

  private updateSessionActivity(userId: string): void {
    const session = this.activeSessions.get(userId);
    if (session) {
      session.lastActivity = new Date();
      session.interactions++;
    }
  }

  private getTaskUpdatePriority(state: string): 'low' | 'medium' | 'high' {
    switch (state) {
      case 'COMPLETED':
      case 'FAILED':
      case 'AWAITING_SIGN':
        return 'high';
      case 'RUNNING':
        return 'medium';
      default:
        return 'low';
    }
  }

  private async generateWelcomeMessage(userId: string): Promise<string> {
    // In a real implementation, this would be personalized based on user history
    const welcomeMessages = [
      "Welcome back! I'm ready to help with your Web3 tasks.",
      "Hi there! What would you like me to help you with today?",
      "Great to see you! I can help with contracts, NFTs, tokens, and more.",
      "Hello! I'm your Web3 companion, ready to automate your blockchain tasks."
    ];
    
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  }

  private async processFeedback(feedback: UserFeedback): Promise<void> {
    // Process feedback for immediate improvements
    if (feedback.type === 'bug_report') {
      this.logActivity('Bug report received', { userId: feedback.userId, content: feedback.content });
      // In production: send to monitoring system, create ticket, etc.
    }
    
    if (feedback.rating && feedback.rating <= 2) {
      this.logActivity('Low satisfaction reported', { 
        userId: feedback.userId, 
        rating: feedback.rating,
        content: feedback.content 
      });
      // In production: trigger immediate follow-up, escalate to support, etc.
    }
  }

  private storeSessionData(sessionData: any): void {
    // In production: store in database, send to analytics service, etc.
    this.logActivity('Session completed', {
      userId: sessionData.userId,
      duration: sessionData.duration,
      interactions: sessionData.interactions,
      satisfaction: sessionData.satisfaction
    });
  }

  private startSessionManagement(): void {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000);
  }

  private cleanupInactiveSessions(): void {
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    
    for (const [userId, session] of this.activeSessions.entries()) {
      if (session.lastActivity < cutoffTime) {
        this.endUserSession(userId, session.sessionId);
      }
    }
  }

  getUserSessionStats(): Record<string, any> {
    return {
      activeSessions: this.activeSessions.size,
      totalFeedback: this.userFeedback.length,
      averageSatisfaction: this.calculateAverageSatisfaction(),
      activeConnections: this.websocketConnections.size
    };
  }

  private calculateAverageSatisfaction(): number {
    const ratingsWithFeedback = this.userFeedback
      .filter(f => f.rating !== undefined)
      .map(f => f.rating!);
    
    if (ratingsWithFeedback.length === 0) return 0;
    
    return ratingsWithFeedback.reduce((sum, rating) => sum + rating, 0) / ratingsWithFeedback.length;
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