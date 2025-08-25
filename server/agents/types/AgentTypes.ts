// Agent System Types
export interface AgentMessage {
  type: string;
  id: string;
  timestamp: string;
  senderId?: string;
  targetId?: string;
  payload: Record<string, any>;
  retryCount?: number;
  maxRetries?: number;
}

export interface UserMessage {
  type: 'user_message';
  id: string;
  timestamp: string;
  userId: string;
  conversationId: string;
  payload: {
    message: string;
    walletAddress?: string; // Add wallet address to payload
    context: {
      conversationId: string;
      timestamp: string;
      previousTasks?: string[];
    };
  };
}

export interface TaskMessage {
  type: 'task_assignment' | 'task_update' | 'task_complete' | 'task_failed';
  id: string;
  timestamp: string;
  taskId: string;
  userId: string;
  payload: {
    category: string;
    parameters: Record<string, any>;
    priority: 'low' | 'medium' | 'high';
    estimatedDuration?: string;
    status?: TaskState;
    result?: any;
    error?: string;
  };
}

export type TaskState = 
  | 'NEW'
  | 'ANALYZING'
  | 'APPROVED'
  | 'QUEUED'
  | 'RUNNING'
  | 'AWAITING_SIGN'
  | 'CONFIRMING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface Task {
  id: string;
  userId: string;
  category?: string;
  type?: string;
  title?: string;
  description: string;
  parameters?: Record<string, any>;
  state?: TaskState;
  status?: string;
  priority: 'low' | 'medium' | 'high';
  steps?: any[];
  createdAt: Date | string;
  updatedAt: Date | string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  estimatedDuration?: string;
  result?: any;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  userId: string;
  preferences: Record<string, any>;
  conversationHistory: string[];
  taskHistory: Task[];
  companionPersonality: string;
  web3Preferences: {
    preferredNetwork: string;
    gasPreference: 'low' | 'medium' | 'high';
    autoApproveLimit: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MCPCapability {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  securityLevel: 'low' | 'medium' | 'high';
  estimatedLatency: string;
}

export interface AgentCapabilities {
  agentId: string;
  capabilities: string[];
  specializations: string[];
  supportedNetworks?: string[];
  securityClearance: 'low' | 'medium' | 'high';
}

export interface ConversationContext {
  conversationId: string;
  userId: string;
  companionPersonality: string;
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  activeTasks: string[];
  userPreferences: Record<string, any>;
}

// Error types
export class AgentError extends Error {
  constructor(
    message: string,
    public agentId: string,
    public errorCode: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class TaskExecutionError extends Error {
  constructor(
    message: string,
    public taskId: string,
    public stage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'TaskExecutionError';
  }
}

export class MCPError extends Error {
  constructor(
    message: string,
    public mcpId: string,
    public operationType: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'MCPError';
  }
}