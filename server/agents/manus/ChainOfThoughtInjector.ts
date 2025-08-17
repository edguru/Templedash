// Manus AI Chain of Thought Injection Implementation
// Dynamically injects reasoning steps into agent working memory during execution
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

export interface EventStreamEntry {
  id: string;
  timestamp: string;
  type: 'user_message' | 'agent_action' | 'tool_result' | 'observation' | 'plan_update' | 'thought_injection';
  content: string;
  metadata?: Record<string, any>;
  status?: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface ThoughtInjection {
  id: string;
  type: 'strategic_thought' | 'validation_thought' | 'correction_thought' | 'planning_thought';
  content: string;
  reasoning: string;
  trigger: 'user_feedback' | 'error_detected' | 'plan_change' | 'context_shift';
  priority: 'low' | 'medium' | 'high';
  injectionPoint: number; // Position in event stream to inject
  confidence: number;
}

export interface AgentState {
  currentPlan: string[];
  activeStep: number;
  workingMemory: EventStreamEntry[];
  thoughtInjections: ThoughtInjection[];
  sessionContext: Record<string, any>;
  toolResults: Record<string, any>;
}

export class ChainOfThoughtInjector extends BaseAgent {
  private openai: OpenAI;
  private eventStream: EventStreamEntry[] = [];
  private agentState: AgentState;
  private maxWorkingMemorySize: number = 50;
  private injectionPatterns: Map<string, string>;

  constructor(agentId: string, messageBroker: MessageBroker) {
    super(agentId, messageBroker);
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  protected initialize(): void {
    this.logActivity('Initializing Manus-style Chain of Thought Injector');
    
    // Initialize all Maps and state
    this.injectionPatterns = new Map();
    this.agentState = {
      currentPlan: [],
      activeStep: 0,
      workingMemory: [],
      thoughtInjections: [],
      sessionContext: {},
      toolResults: {}
    };
    
    this.initializeInjectionPatterns();
    this.setupEventStreamListeners();
  }

  private initializeInjectionPatterns(): void {
    // Strategic thinking injection patterns
    this.injectionPatterns.set('strategic_analysis', `
      <strategic_injection>
      Based on the current context, I should consider:
      1. Alternative approaches to this problem
      2. Potential risks and mitigation strategies  
      3. Long-term implications of my current plan
      4. Resource optimization opportunities
      </strategic_injection>
    `);

    // Error correction injection patterns
    this.injectionPatterns.set('error_correction', `
      <correction_injection>
      I notice an issue with my current approach:
      1. Analyze what went wrong in the previous step
      2. Identify the root cause of the problem
      3. Generate alternative solution strategies
      4. Select the most robust approach going forward
      </correction_injection>
    `);

    // Plan adaptation injection patterns
    this.injectionPatterns.set('plan_adaptation', `
      <adaptation_injection>
      The situation has changed, so I need to:
      1. Reassess my current plan against new information
      2. Identify which steps need modification
      3. Update priorities based on new context
      4. Ensure continuity with work already completed
      </adaptation_injection>
    `);

    // Validation injection patterns  
    this.injectionPatterns.set('validation_check', `
      <validation_injection>
      Before proceeding, I should validate:
      1. Are my assumptions still correct?
      2. Have I missed any important considerations?
      3. Is my current approach optimal?
      4. What quality checks should I perform?
      </validation_injection>
    `);
  }

  private setupEventStreamListeners(): void {
    // Listen for events that might trigger thought injections
    this.messageBroker.subscribe('task_error', this.handleTaskError.bind(this));
    this.messageBroker.subscribe('context_change', this.handleContextChange.bind(this));
    this.messageBroker.subscribe('user_feedback', this.handleUserFeedback.bind(this));
    this.messageBroker.subscribe('plan_update', this.handlePlanUpdate.bind(this));
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    switch (message.type) {
      case 'start_agent_session':
        return this.startAgentSession(message);
      case 'inject_thoughts':
        return this.processThoughtInjection(message);
      case 'get_working_memory':
        return this.getWorkingMemoryStatus(message);
      case 'update_event_stream':
        return this.updateEventStream(message);
      default:
        return null;
    }
  }

  private async startAgentSession(message: AgentMessage): Promise<AgentMessage> {
    const { taskDescription, userContext } = message.payload;
    
    // Initialize event stream with user request
    const initialEvent: EventStreamEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'user_message',
      content: taskDescription,
      metadata: { userContext },
      status: 'completed'
    };

    this.eventStream.push(initialEvent);
    this.agentState.sessionContext = userContext || {};

    // Generate initial plan with thought injection
    const planInjection = await this.injectPlanningThoughts(taskDescription);
    
    return {
      type: 'agent_session_started',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        sessionId: uuidv4(),
        initialPlan: planInjection.content,
        eventStreamId: initialEvent.id,
        workingMemory: this.getLatestWorkingMemory()
      }
    };
  }

  private async injectPlanningThoughts(taskDescription: string): Promise<ThoughtInjection> {
    const planningPrompt = `
      ${this.injectionPatterns.get('strategic_analysis')}
      
      Task: ${taskDescription}
      Context: ${JSON.stringify(this.agentState.sessionContext)}
      
      Generate a strategic planning thought that should be injected into the agent's working memory.
      Consider multiple approaches, potential challenges, and optimization opportunities.
      
      Respond with a structured thought that will guide the agent's reasoning process.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: 'You are a strategic thinking module that generates planning thoughts for injection into an AI agent\'s working memory.' },
          { role: 'user', content: planningPrompt }
        ],
        max_tokens: 400,
        temperature: 0.7
      });

      const thoughtContent = response.choices[0].message.content || '';
      
      const injection: ThoughtInjection = {
        id: uuidv4(),
        type: 'planning_thought',
        content: thoughtContent,
        reasoning: 'Generated initial strategic planning thoughts for complex task execution',
        trigger: 'context_shift',
        priority: 'high',
        injectionPoint: this.eventStream.length,
        confidence: 0.85
      };

      // Inject the thought into working memory
      await this.executeThoughtInjection(injection);
      
      return injection;
    } catch (error) {
      this.logActivity('Error generating planning thoughts', { error: error.message });
      
      // Fallback injection
      return {
        id: uuidv4(),
        type: 'planning_thought',
        content: 'I need to break this task down systematically and consider multiple approaches.',
        reasoning: 'Fallback planning thought due to LLM error',
        trigger: 'context_shift',
        priority: 'medium',
        injectionPoint: this.eventStream.length,
        confidence: 0.6
      };
    }
  }

  private async handleTaskError(message: AgentMessage): Promise<void> {
    const errorDetails = message.payload;
    
    // Generate error correction thought injection
    const correctionInjection = await this.generateErrorCorrectionThought(errorDetails);
    await this.executeThoughtInjection(correctionInjection);
    
    // Add error event to stream
    const errorEvent: EventStreamEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'observation',
      content: `Error encountered: ${errorDetails.error}`,
      metadata: errorDetails,
      status: 'failed'
    };
    
    this.addToEventStream(errorEvent);
    this.logActivity('Injected error correction thoughts', { errorId: errorDetails.taskId });
  }

  private async handleContextChange(message: AgentMessage): Promise<void> {
    const contextChange = message.payload;
    
    // Generate adaptation thought injection
    const adaptationInjection: ThoughtInjection = {
      id: uuidv4(),
      type: 'strategic_thought',
      content: `Context has changed: ${contextChange.description}. I need to reassess my current approach and adapt my plan accordingly.`,
      reasoning: 'Context change detected, need to adapt strategy',
      trigger: 'context_shift',
      priority: 'high',
      injectionPoint: this.eventStream.length,
      confidence: 0.8
    };

    await this.executeThoughtInjection(adaptationInjection);
    
    const contextEvent: EventStreamEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'observation',
      content: `Context update: ${contextChange.description}`,
      metadata: contextChange,
      status: 'completed'
    };
    
    this.addToEventStream(contextEvent);
  }

  private async handleUserFeedback(message: AgentMessage): Promise<void> {
    const feedback = message.payload;
    
    // Generate validation thought injection based on user feedback
    const validationInjection: ThoughtInjection = {
      id: uuidv4(),
      type: 'validation_thought',
      content: `User feedback received: "${feedback.message}". I should validate my current approach and incorporate this feedback into my reasoning.`,
      reasoning: 'User feedback integration',
      trigger: 'user_feedback',
      priority: 'high',
      injectionPoint: this.eventStream.length,
      confidence: 0.9
    };

    await this.executeThoughtInjection(validationInjection);
    
    const feedbackEvent: EventStreamEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'user_message',
      content: feedback.message,
      metadata: { feedbackType: feedback.type },
      status: 'completed'
    };
    
    this.addToEventStream(feedbackEvent);
  }

  private async handlePlanUpdate(message: AgentMessage): Promise<void> {
    const planUpdate = message.payload;
    
    // Update agent state plan
    this.agentState.currentPlan = planUpdate.newPlan || [];
    this.agentState.activeStep = planUpdate.currentStep || 0;
    
    // Generate plan adaptation thought
    const adaptationInjection: ThoughtInjection = {
      id: uuidv4(),
      type: 'planning_thought',
      content: `Plan updated: ${planUpdate.reason}. New approach: ${planUpdate.newPlan?.join(', ')}`,
      reasoning: 'Plan modification based on execution progress',
      trigger: 'plan_change',
      priority: 'medium',
      injectionPoint: this.eventStream.length,
      confidence: 0.75
    };

    await this.executeThoughtInjection(adaptationInjection);
    
    const planEvent: EventStreamEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'plan_update',
      content: `Plan modified: ${planUpdate.reason}`,
      metadata: planUpdate,
      status: 'completed'
    };
    
    this.addToEventStream(planEvent);
  }

  private async generateErrorCorrectionThought(errorDetails: any): Promise<ThoughtInjection> {
    const correctionPrompt = `
      ${this.injectionPatterns.get('error_correction')}
      
      Error Details: ${JSON.stringify(errorDetails)}
      Current Plan: ${this.agentState.currentPlan.join(', ')}
      Recent Context: ${this.getLatestWorkingMemory().slice(-3).map(e => e.content).join(' | ')}
      
      Generate a correction thought that analyzes the error and suggests a recovery strategy.
      Focus on practical next steps and learning from the failure.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: 'You are an error analysis module that generates corrective thoughts for AI agent recovery.' },
          { role: 'user', content: correctionPrompt }
        ],
        max_tokens: 300,
        temperature: 0.5
      });

      const correctionContent = response.choices[0].message.content || '';
      
      return {
        id: uuidv4(),
        type: 'correction_thought',
        content: correctionContent,
        reasoning: 'Generated error correction strategy based on failure analysis',
        trigger: 'error_detected',
        priority: 'high',
        injectionPoint: this.eventStream.length,
        confidence: 0.8
      };
    } catch (error) {
      // Fallback correction thought
      return {
        id: uuidv4(),
        type: 'correction_thought',
        content: 'I need to analyze what went wrong and try a different approach to overcome this error.',
        reasoning: 'Fallback error correction thought',
        trigger: 'error_detected',
        priority: 'medium',
        injectionPoint: this.eventStream.length,
        confidence: 0.6
      };
    }
  }

  private async executeThoughtInjection(injection: ThoughtInjection): Promise<void> {
    // Add thought injection to agent state
    this.agentState.thoughtInjections.push(injection);
    
    // Create thought injection event for event stream
    const thoughtEvent: EventStreamEntry = {
      id: injection.id,
      timestamp: new Date().toISOString(),
      type: 'thought_injection',
      content: injection.content,
      metadata: {
        type: injection.type,
        trigger: injection.trigger,
        priority: injection.priority,
        confidence: injection.confidence
      },
      status: 'completed'
    };
    
    this.addToEventStream(thoughtEvent);
    this.updateWorkingMemory();
    
    this.logActivity('Thought injection executed', {
      injectionId: injection.id,
      type: injection.type,
      trigger: injection.trigger
    });
  }

  private addToEventStream(event: EventStreamEntry): void {
    this.eventStream.push(event);
    
    // Maintain event stream size limit
    if (this.eventStream.length > 1000) {
      this.eventStream = this.eventStream.slice(-800); // Keep most recent 800 events
    }
  }

  private updateWorkingMemory(): void {
    // Update working memory with latest events (sliding window)
    const latestEvents = this.eventStream.slice(-this.maxWorkingMemorySize);
    this.agentState.workingMemory = latestEvents;
  }

  private getLatestWorkingMemory(): EventStreamEntry[] {
    return this.agentState.workingMemory;
  }

  private async processThoughtInjection(message: AgentMessage): Promise<AgentMessage> {
    const { injectionType, context, priority } = message.payload;
    
    let injection: ThoughtInjection;
    
    switch (injectionType) {
      case 'strategic':
        injection = await this.generateStrategicInjection(context);
        break;
      case 'validation':
        injection = await this.generateValidationInjection(context);
        break;
      case 'correction':
        injection = await this.generateErrorCorrectionThought(context);
        break;
      default:
        injection = await this.generateGenericInjection(context);
    }
    
    if (priority) injection.priority = priority;
    await this.executeThoughtInjection(injection);
    
    return {
      type: 'thought_injection_complete',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        injectionId: injection.id,
        content: injection.content,
        workingMemory: this.getLatestWorkingMemory()
      }
    };
  }

  private async generateStrategicInjection(context: any): Promise<ThoughtInjection> {
    // Use the strategic analysis pattern
    const strategicContent = `Strategic consideration: Given the current context (${JSON.stringify(context)}), I should evaluate alternative approaches and consider long-term implications.`;
    
    return {
      id: uuidv4(),
      type: 'strategic_thought',
      content: strategicContent,
      reasoning: 'Strategic thinking injection for enhanced decision-making',
      trigger: 'context_shift',
      priority: 'medium',
      injectionPoint: this.eventStream.length,
      confidence: 0.75
    };
  }

  private async generateValidationInjection(context: any): Promise<ThoughtInjection> {
    const validationContent = `Validation check: I should verify my current assumptions and approach given: ${JSON.stringify(context)}`;
    
    return {
      id: uuidv4(),
      type: 'validation_thought',
      content: validationContent,
      reasoning: 'Quality validation injection for accuracy assurance',
      trigger: 'user_feedback',
      priority: 'high',
      injectionPoint: this.eventStream.length,
      confidence: 0.85
    };
  }

  private async generateGenericInjection(context: any): Promise<ThoughtInjection> {
    return {
      id: uuidv4(),
      type: 'strategic_thought',
      content: `I need to consider: ${JSON.stringify(context)}`,
      reasoning: 'Generic thought injection for context consideration',
      trigger: 'context_shift',
      priority: 'low',
      injectionPoint: this.eventStream.length,
      confidence: 0.6
    };
  }

  private async getWorkingMemoryStatus(message: AgentMessage): Promise<AgentMessage> {
    return {
      type: 'working_memory_status',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        eventStreamLength: this.eventStream.length,
        workingMemorySize: this.agentState.workingMemory.length,
        activeThoughtInjections: this.agentState.thoughtInjections.length,
        currentPlan: this.agentState.currentPlan,
        activeStep: this.agentState.activeStep,
        latestEvents: this.getLatestWorkingMemory().slice(-5)
      }
    };
  }

  private async updateEventStream(message: AgentMessage): Promise<AgentMessage> {
    const { eventType, content, metadata } = message.payload;
    
    const newEvent: EventStreamEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: eventType,
      content,
      metadata,
      status: 'completed'
    };
    
    this.addToEventStream(newEvent);
    this.updateWorkingMemory();
    
    return {
      type: 'event_stream_updated',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        eventId: newEvent.id,
        streamLength: this.eventStream.length
      }
    };
  }

  getCapabilities(): string[] {
    return [
      'chain_of_thought_injection',
      'dynamic_reasoning_updates', 
      'event_stream_management',
      'working_memory_optimization',
      'strategic_thought_generation',
      'error_correction_injection',
      'plan_adaptation_thoughts',
      'validation_thought_injection'
    ];
  }

  // Export working memory for agent coordination
  public exportWorkingMemory(): {
    eventStream: EventStreamEntry[];
    workingMemory: EventStreamEntry[];
    thoughtInjections: ThoughtInjection[];
    agentState: AgentState;
  } {
    return {
      eventStream: [...this.eventStream],
      workingMemory: [...this.agentState.workingMemory],
      thoughtInjections: [...this.agentState.thoughtInjections],
      agentState: { ...this.agentState }
    };
  }

  // Import working memory from another agent
  public importWorkingMemory(memoryData: {
    eventStream: EventStreamEntry[];
    thoughtInjections: ThoughtInjection[];
  }): void {
    this.eventStream = [...memoryData.eventStream];
    this.agentState.thoughtInjections = [...memoryData.thoughtInjections];
    this.updateWorkingMemory();
    
    this.logActivity('Working memory imported from external agent');
  }
}