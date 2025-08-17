// Profile Memory Agent - Stores user and companion profile/context/history
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage, UserProfile, ConversationContext } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export class ProfileMemory extends BaseAgent {
  private userProfiles: Map<string, UserProfile> = new Map();
  private conversationHistory: Map<string, ConversationMessage[]> = new Map();
  private userPreferences: Map<string, Record<string, any>> = new Map();
  private companionPersonalities: Map<string, string> = new Map();

  constructor(messageBroker: MessageBroker) {
    super('profile-memory', messageBroker);
  }

  protected initialize(): void {
    this.logActivity('Initializing Profile Memory');
    
    // Subscribe to profile requests
    this.messageBroker.subscribe('get_user_profile', async (message: AgentMessage) => {
      await this.handleMessage(message);
    });

    this.messageBroker.subscribe('update_user_preference', async (message: AgentMessage) => {
      await this.handleMessage(message);
    });

    this.messageBroker.subscribe('store_conversation', async (message: AgentMessage) => {
      await this.handleMessage(message);
    });
  }

  getCapabilities(): string[] {
    return [
      'user_profiling',
      'preference_storage',
      'conversation_history',
      'context_management',
      'personality_adaptation',
      'memory_retrieval'
    ];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      this.logActivity('Handling message', { type: message.type });

      switch (message.type) {
        case 'get_user_profile':
          return await this.getUserProfileMessage(message.payload.userId);
          
        case 'update_user_preference':
          await this.updateUserPreference(
            message.payload.userId,
            message.payload.key,
            message.payload.value
          );
          break;
          
        case 'store_conversation':
          await this.storeConversation(
            message.payload.userId,
            message.payload.messages
          );
          break;

        case 'get_conversation_context':
          return await this.getConversationContext(
            message.payload.userId,
            message.payload.conversationId
          );
      }

      return null;
    } catch (error) {
      console.error('[ProfileMemory] Error handling message:', error);
      return this.createErrorResponse(message, 'Failed to process memory request');
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = await this.createDefaultProfile(userId);
      this.userProfiles.set(userId, profile);
    }

    return profile;
  }

  async updateUserPreference(userId: string, key: string, value: any): Promise<void> {
    let preferences = this.userPreferences.get(userId);
    
    if (!preferences) {
      preferences = {};
      this.userPreferences.set(userId, preferences);
    }

    preferences[key] = value;

    // Update profile
    const profile = await this.getUserProfile(userId);
    if (profile) {
      profile.preferences = preferences;
      profile.updatedAt = new Date();
    }

    this.logActivity('Updated user preference', { userId, key, value });
  }

  async addConversationMessage(userId: string, message: ConversationMessage): Promise<void> {
    let history = this.conversationHistory.get(userId);
    
    if (!history) {
      history = [];
      this.conversationHistory.set(userId, history);
    }

    history.push(message);

    // Keep only last 100 messages per user
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    // Update profile
    const profile = await this.getUserProfile(userId);
    if (profile) {
      profile.conversationHistory = history.map(m => m.content).slice(-20); // Last 20 for profile
      profile.updatedAt = new Date();
    }

    this.logActivity('Added conversation message', { userId, role: message.role });
  }

  async getConversationHistory(userId: string, limit: number = 10): Promise<ConversationMessage[]> {
    const history = this.conversationHistory.get(userId) || [];
    return history.slice(-limit);
  }

  async setCompanionPersonality(userId: string, personality: string): Promise<void> {
    this.companionPersonalities.set(userId, personality);

    const profile = await this.getUserProfile(userId);
    if (profile) {
      profile.companionPersonality = personality;
      profile.updatedAt = new Date();
    }

    this.logActivity('Set companion personality', { userId, personality });
  }

  async getCompanionPersonality(userId: string): Promise<string> {
    return this.companionPersonalities.get(userId) || 'helpful';
  }

  async updateWeb3Preferences(userId: string, web3Prefs: any): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (profile) {
      profile.web3Preferences = {
        ...profile.web3Preferences,
        ...web3Prefs
      };
      profile.updatedAt = new Date();
    }

    this.logActivity('Updated Web3 preferences', { userId, prefs: web3Prefs });
  }

  async getPersonalizedResponse(userId: string, baseResponse: string): Promise<string> {
    const personality = await this.getCompanionPersonality(userId);
    const preferences = this.userPreferences.get(userId) || {};

    // Apply personality and preferences to response
    let personalizedResponse = baseResponse;

    // Apply personality style
    switch (personality) {
      case 'casual':
        personalizedResponse = this.applyCasualStyle(personalizedResponse);
        break;
      case 'professional':
        personalizedResponse = this.applyProfessionalStyle(personalizedResponse);
        break;
      case 'technical':
        personalizedResponse = this.applyTechnicalStyle(personalizedResponse);
        break;
    }

    // Apply user preferences
    if (preferences.verbosity === 'brief') {
      personalizedResponse = this.makeBrief(personalizedResponse);
    } else if (preferences.verbosity === 'detailed') {
      personalizedResponse = this.makeDetailed(personalizedResponse);
    }

    return personalizedResponse;
  }

  async analyzeUserBehavior(userId: string): Promise<Record<string, any>> {
    const profile = await this.getUserProfile(userId);
    const history = this.conversationHistory.get(userId) || [];

    if (!profile || history.length < 5) {
      return {};
    }

    // Analyze conversation patterns
    const userMessages = history.filter(m => m.role === 'user');
    const avgMessageLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    
    // Detect preferred topics
    const topicCounts = userMessages.reduce((counts, message) => {
      const topics = this.extractTopics(message.content);
      topics.forEach(topic => {
        counts[topic] = (counts[topic] || 0) + 1;
      });
      return counts;
    }, {} as Record<string, number>);

    // Detect communication style
    const hasQuestions = userMessages.some(m => m.content.includes('?'));
    const hasUrgentLanguage = userMessages.some(m => /urgent|asap|quickly|now/i.test(m.content));
    const hasCasualLanguage = userMessages.some(m => /hey|hi|cool|awesome/i.test(m.content));

    return {
      avgMessageLength,
      preferredTopics: Object.keys(topicCounts).sort((a, b) => topicCounts[b] - topicCounts[a]).slice(0, 5),
      communicationStyle: {
        asksQuestions: hasQuestions,
        usesUrgentLanguage: hasUrgentLanguage,
        usesCasualLanguage: hasCasualLanguage
      },
      activityLevel: history.length
    };
  }

  private async createDefaultProfile(userId: string): Promise<UserProfile> {
    return {
      userId,
      preferences: {},
      conversationHistory: [],
      taskHistory: [],
      companionPersonality: 'helpful',
      web3Preferences: {
        preferredNetwork: 'base_camp_testnet',
        gasPreference: 'medium',
        autoApproveLimit: 0.01
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async getUserProfileMessage(userId: string): Promise<AgentMessage> {
    const profile = await this.getUserProfile(userId);
    
    return {
      type: 'user_profile_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      payload: {
        userId,
        profile: this.sanitizeProfile(profile!)
      }
    };
  }

  private async storeConversation(userId: string, messages: ConversationMessage[]): Promise<void> {
    for (const message of messages) {
      await this.addConversationMessage(userId, message);
    }
  }

  private async getConversationContext(userId: string, conversationId: string): Promise<AgentMessage> {
    const profile = await this.getUserProfile(userId);
    const recentMessages = await this.getConversationHistory(userId, 10);
    const activeTasks: string[] = []; // Would be populated from TaskTracker

    const context: ConversationContext = {
      conversationId,
      userId,
      companionPersonality: profile?.companionPersonality || 'helpful',
      recentMessages,
      activeTasks,
      userPreferences: profile?.preferences || {}
    };

    return {
      type: 'conversation_context_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      payload: {
        context
      }
    };
  }

  private sanitizeProfile(profile: UserProfile): Partial<UserProfile> {
    // Remove sensitive data before returning
    return {
      userId: profile.userId,
      preferences: profile.preferences,
      companionPersonality: profile.companionPersonality,
      web3Preferences: profile.web3Preferences,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  }

  private applyCasualStyle(response: string): string {
    // Add casual elements
    const casualPrefixes = ['Hey! ', 'Cool! ', 'Nice! ', 'Awesome! '];
    const casualSuffixes = [' 😊', ' 🎉', ' 👍'];
    
    if (Math.random() < 0.3) {
      response = casualPrefixes[Math.floor(Math.random() * casualPrefixes.length)] + response;
    }
    
    return response.replace(/\./g, '!').replace(/I will/g, "I'll").replace(/cannot/g, "can't");
  }

  private applyProfessionalStyle(response: string): string {
    // Make more formal
    return response
      .replace(/I'll/g, 'I will')
      .replace(/can't/g, 'cannot')
      .replace(/won't/g, 'will not')
      .replace(/!/g, '.');
  }

  private applyTechnicalStyle(response: string): string {
    // Add technical details
    const technicalTerms = {
      'deploy': 'deploy via smart contract',
      'send': 'execute transaction',
      'check': 'query blockchain state',
      'mint': 'mint via contract call'
    };
    
    let technicalResponse = response;
    Object.entries(technicalTerms).forEach(([term, replacement]) => {
      technicalResponse = technicalResponse.replace(new RegExp(term, 'gi'), replacement);
    });
    
    return technicalResponse;
  }

  private makeBrief(response: string): string {
    // Shorten response
    return response.split('.')[0] + '.';
  }

  private makeDetailed(response: string): string {
    // Add more details (in real implementation, this would be more sophisticated)
    return response + ' I can provide more specific details if needed.';
  }

  private extractTopics(message: string): string[] {
    const topics: string[] = [];
    const topicMap = {
      'contract': ['contract', 'smart contract', 'deploy'],
      'nft': ['nft', 'token', 'mint'],
      'defi': ['stake', 'bridge', 'swap', 'liquidity'],
      'wallet': ['wallet', 'balance', 'address'],
      'transaction': ['send', 'transfer', 'pay']
    };

    Object.entries(topicMap).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
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