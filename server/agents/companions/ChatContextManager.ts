import { eq, desc, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { 
  conversations, 
  chatSessions, 
  companions,
  type Conversation,
  type ChatSession,
  type InsertConversation,
  type InsertChatSession
} from '../../../shared/schema';
import { v4 as uuidv4 } from 'uuid';

// Enhanced chat context with user memory and conversation management
export interface UserChatContext {
  userId: number;
  currentSessionId: string;
  conversationHistory: Conversation[];
  activeSessions: ChatSession[];
  companionPersonality: any;
  userPreferences: {
    responseStyle: 'casual' | 'professional' | 'friendly';
    topics: string[];
    taskHistory: string[];
  };
  relationshipData: {
    interactionCount: number;
    favoriteTopics: string[];
    lastInteractionDate: Date;
    moodPattern: string[];
  };
}

export interface ChatMessage {
  id?: number;
  sessionId: string;
  userMessage: string;
  companionResponse?: string;
  messageType: 'chat' | 'task' | 'system';
  sentiment?: 'positive' | 'neutral' | 'negative';
  taskExecuted?: boolean;
  executedByAgent?: string;
  context?: Record<string, any>;
}

export class ChatContextManager {
  private db: any;
  private userContexts: Map<number, UserChatContext> = new Map();

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log('[ChatContextManager] Initializing chat context and history management');
  }

  // Create new chat session
  async createChatSession(userId: number, companionId?: number, title?: string): Promise<string> {
    const sessionId = uuidv4();
    
    try {
      await this.db.insert(chatSessions).values({
        sessionId,
        userId,
        companionId,
        title: title || 'New Chat',
        messageCount: 0,
        lastMessageAt: new Date()
      });

      console.log('[ChatContextManager] Created new chat session', { sessionId, userId, title });
      return sessionId;
    } catch (error) {
      console.error('[ChatContextManager] Failed to create chat session:', error);
      throw error;
    }
  }

  // Get user's active chat sessions
  async getUserChatSessions(userId: number): Promise<ChatSession[]> {
    try {
      const sessions = await this.db
        .select()
        .from(chatSessions)
        .where(and(
          eq(chatSessions.userId, userId),
          eq(chatSessions.isArchived, false)
        ))
        .orderBy(desc(chatSessions.lastMessageAt));

      return sessions;
    } catch (error) {
      console.error('[ChatContextManager] Failed to fetch user sessions:', error);
      return [];
    }
  }

  // Get conversation history for a specific session
  async getConversationHistory(sessionId: string, limit: number = 50): Promise<Conversation[]> {
    try {
      const history = await this.db
        .select()
        .from(conversations)
        .where(eq(conversations.sessionId, sessionId))
        .orderBy(desc(conversations.createdAt))
        .limit(limit);

      return history.reverse(); // Return in chronological order
    } catch (error) {
      console.error('[ChatContextManager] Failed to fetch conversation history:', error);
      return [];
    }
  }

  // Save a conversation turn
  async saveConversation(chatMessage: ChatMessage): Promise<void> {
    try {
      const insertData: InsertConversation = {
        userId: await this.getUserIdFromSession(chatMessage.sessionId),
        sessionId: chatMessage.sessionId,
        userMessage: chatMessage.userMessage,
        companionResponse: chatMessage.companionResponse || '',
        messageType: chatMessage.messageType,
        sentiment: chatMessage.sentiment,
        taskExecuted: chatMessage.taskExecuted || false,
        executedByAgent: chatMessage.executedByAgent,
        context: chatMessage.context ? JSON.stringify(chatMessage.context) : null
      };

      await this.db.insert(conversations).values(insertData);

      // Update session message count and last message time
      await this.updateSessionActivity(chatMessage.sessionId);

      console.log('[ChatContextManager] Saved conversation turn', { 
        sessionId: chatMessage.sessionId,
        messageType: chatMessage.messageType
      });
    } catch (error) {
      console.error('[ChatContextManager] Failed to save conversation:', error);
      throw error;
    }
  }

  // Get enhanced user context with conversation history
  async getUserContext(userId: number, sessionId?: string): Promise<UserChatContext | null> {
    try {
      // Check cache first
      if (this.userContexts.has(userId)) {
        const cachedContext = this.userContexts.get(userId)!;
        if (sessionId && cachedContext.currentSessionId !== sessionId) {
          cachedContext.currentSessionId = sessionId;
          cachedContext.conversationHistory = await this.getConversationHistory(sessionId);
        }
        return cachedContext;
      }

      // Build context from database
      const sessions = await this.getUserChatSessions(userId);
      const currentSession = sessionId || sessions[0]?.sessionId;
      const conversationHistory = currentSession ? await this.getConversationHistory(currentSession) : [];

      // Get companion personality if available
      const companion = await this.getUserCompanion(userId);

      const userContext: UserChatContext = {
        userId,
        currentSessionId: currentSession || '',
        conversationHistory,
        activeSessions: sessions,
        companionPersonality: companion,
        userPreferences: await this.buildUserPreferences(userId, conversationHistory),
        relationshipData: await this.buildRelationshipData(userId, conversationHistory)
      };

      // Cache the context
      this.userContexts.set(userId, userContext);

      console.log('[ChatContextManager] Built user context', { 
        userId, 
        sessionCount: sessions.length,
        historyLength: conversationHistory.length
      });

      return userContext;
    } catch (error) {
      console.error('[ChatContextManager] Failed to get user context:', error);
      return null;
    }
  }

  // Analyze conversation for sentiment
  analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['love', 'great', 'awesome', 'excellent', 'happy', 'good', 'amazing', 'perfect', 'thanks'];
    const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'angry', 'frustrated', 'problem', 'error', 'failed'];
    
    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Generate contextual response based on chat history
  generateContextualPrompt(userContext: UserChatContext, currentMessage: string): string {
    const { companionPersonality, conversationHistory, relationshipData } = userContext;
    
    // Build conversation summary
    const recentMessages = conversationHistory.slice(-5);
    const conversationSummary = recentMessages.map(msg => 
      `User: ${msg.userMessage}\nCompanion: ${msg.companionResponse}`
    ).join('\n\n');

    // Build relationship context
    const relationshipContext = `
Interaction Count: ${relationshipData.interactionCount}
Favorite Topics: ${relationshipData.favoriteTopics.join(', ')}
Recent Mood: ${relationshipData.moodPattern.slice(-3).join(' → ')}
Last Interaction: ${relationshipData.lastInteractionDate.toLocaleDateString()}
    `.trim();

    // Build enhanced prompt
    return `You are ${companionPersonality?.name || 'AI Companion'}, an AI companion with the following personality:
- Role: ${companionPersonality?.role || 'friend'}
- Personality: ${companionPersonality?.personalityType || 'helpful'}
- Traits: Intelligence ${companionPersonality?.intelligence || 75}/100, Humor ${companionPersonality?.humor || 75}/100, Empathy ${companionPersonality?.empathy || 85}/100

RELATIONSHIP CONTEXT:
${relationshipContext}

RECENT CONVERSATION HISTORY:
${conversationSummary}

CURRENT MESSAGE: "${currentMessage}"

Respond naturally as ${companionPersonality?.name || 'the companion'}, considering your personality traits and the conversation history. Keep responses concise but warm and engaging.`;
  }

  // Archive a chat session
  async archiveChatSession(sessionId: string): Promise<void> {
    try {
      await this.db
        .update(chatSessions)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(eq(chatSessions.sessionId, sessionId));

      console.log('[ChatContextManager] Archived chat session', { sessionId });
    } catch (error) {
      console.error('[ChatContextManager] Failed to archive session:', error);
      throw error;
    }
  }

  // Update chat session title
  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    try {
      await this.db
        .update(chatSessions)
        .set({ title, updatedAt: new Date() })
        .where(eq(chatSessions.sessionId, sessionId));

      console.log('[ChatContextManager] Updated session title', { sessionId, title });
    } catch (error) {
      console.error('[ChatContextManager] Failed to update session title:', error);
      throw error;
    }
  }

  // Helper methods
  private async getUserIdFromSession(sessionId: string): Promise<number> {
    const session = await this.db
      .select({ userId: chatSessions.userId })
      .from(chatSessions)
      .where(eq(chatSessions.sessionId, sessionId))
      .limit(1);
    
    return session[0]?.userId || 0;
  }

  private async getUserCompanion(userId: number): Promise<any> {
    try {
      const companion = await this.db
        .select()
        .from(companions)
        .where(eq(companions.userId, userId))
        .limit(1);
      
      return companion[0] || null;
    } catch (error) {
      return null;
    }
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await this.db
        .update(chatSessions)
        .set({ 
          lastMessageAt: new Date(),
          messageCount: this.db.sql`${chatSessions.messageCount} + 1`
        })
        .where(eq(chatSessions.sessionId, sessionId));
    } catch (error) {
      console.error('[ChatContextManager] Failed to update session activity:', error);
    }
  }

  private async buildUserPreferences(userId: number, history: Conversation[]): Promise<any> {
    // Analyze conversation history to determine user preferences
    const topics = history.map(msg => msg.userMessage).join(' ');
    const taskTypes = history.filter(msg => msg.taskExecuted).map(msg => msg.executedByAgent || 'task');

    return {
      responseStyle: 'friendly', // Could be analyzed from message patterns
      topics: this.extractTopics(topics),
      taskHistory: [...new Set(taskTypes)]
    };
  }

  private async buildRelationshipData(userId: number, history: Conversation[]): Promise<any> {
    const interactionCount = history.length;
    const moodPattern = history.slice(-10).map(msg => msg.sentiment || 'neutral');
    const lastInteraction = history.length > 0 ? new Date(history[history.length - 1].createdAt) : new Date();

    return {
      interactionCount,
      favoriteTopics: this.extractTopics(history.map(h => h.userMessage).join(' ')),
      lastInteractionDate: lastInteraction,
      moodPattern
    };
  }

  private extractTopics(text: string): string[] {
    const commonTopics = ['blockchain', 'crypto', 'trading', 'defi', 'nft', 'games', 'ai', 'technology'];
    const lowerText = text.toLowerCase();
    
    return commonTopics.filter(topic => lowerText.includes(topic));
  }

  // Clean up cached contexts (called periodically)
  clearCache(): void {
    this.userContexts.clear();
    console.log('[ChatContextManager] Cleared user context cache');
  }
}