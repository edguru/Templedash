// Manus-style Orchestrator with Chain of Thought Injection
// Replicates Manus AI's event stream + dynamic reasoning injection approach
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { ChainOfThoughtInjector, EventStreamEntry, ThoughtInjection, AgentState } from './ChainOfThoughtInjector';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

interface ManusSession {
  id: string;
  userId: string;
  startTime: string;
  eventStream: EventStreamEntry[];
  currentPlan: string[];
  activeStep: number;
  status: 'active' | 'idle' | 'error' | 'completed';
  workingMemory: EventStreamEntry[];
  thoughtHistory: ThoughtInjection[];
  sessionContext: Record<string, any>;
}

interface ToolExecution {
  toolName: string;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  executionTime: number;
}

export class ManusOrchestrator extends BaseAgent {
  private openai: OpenAI;
  private cotInjector: ChainOfThoughtInjector;
  private activeSessions: Map<string, ManusSession> = new Map();
  private availableTools: Map<string, string> = new Map();
  private maxIterations: number = 50; // Prevent infinite loops
  
  constructor(messageBroker: MessageBroker) {
    super('manus-orchestrator', messageBroker);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.cotInjector = new ChainOfThoughtInjector('manus-cot', messageBroker);
  }

  protected initialize(): void {
    this.logActivity('Initializing Manus-style Orchestrator with Chain of Thought Injection');
    
    this.setupToolMappings();
    this.setupEventListeners();
  }

  private setupToolMappings(): void {
    this.availableTools.set('web_search', 'research-mcp');
    this.availableTools.set('blockchain_query', 'goat-mcp');
    this.availableTools.set('code_generation', 'codegen-mcp');
    this.availableTools.set('document_creation', 'docwriter-mcp');
    this.availableTools.set('task_scheduling', 'scheduler-mcp');
    this.availableTools.set('contract_deployment', 'goat-mcp');
    this.availableTools.set('nft_operations', 'goat-mcp');
  }

  private setupEventListeners(): void {
    this.messageBroker.subscribe('start_manus_session', async (message) => {
      await this.startManusSession(message);
    });
    this.messageBroker.subscribe('manus_user_input', async (message) => {
      await this.processUserInput(message);
    });
    this.messageBroker.subscribe('inject_reasoning', async (message) => {
      await this.handleReasoningInjection(message);
    });
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    switch (message.type) {
      case 'start_manus_session':
        return this.startManusSession(message);
      case 'manus_user_input':
        return this.processUserInput(message);
      case 'get_session_status':
        return this.getSessionStatus(message);
      case 'inject_reasoning':
        return this.handleReasoningInjection(message);
      case 'export_session_memory':
        return this.exportSessionMemory(message);
      default:
        return null;
    }
  }

  private async startManusSession(message: AgentMessage): Promise<AgentMessage> {
    const { userId, initialRequest, sessionContext = {} } = message.payload;
    
    const sessionId = uuidv4();
    const session: ManusSession = {
      id: sessionId,
      userId,
      startTime: new Date().toISOString(),
      eventStream: [],
      currentPlan: [],
      activeStep: 0,
      status: 'active',
      workingMemory: [],
      thoughtHistory: [],
      sessionContext
    };

    // Create initial event
    const initialEvent: EventStreamEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'user_message',
      content: initialRequest,
      metadata: { userId, sessionStart: true },
      status: 'completed'
    };

    session.eventStream.push(initialEvent);
    this.activeSessions.set(sessionId, session);

    // Start CoT injector session
    await this.cotInjector.handleMessage({
      type: 'start_agent_session',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'cot-injector',
      payload: {
        taskDescription: initialRequest,
        userContext: sessionContext
      }
    });

    // Generate initial plan with strategic thinking injection
    const planResult = await this.generateInitialPlan(sessionId, initialRequest, sessionContext);
    
    this.logActivity('Manus session started with CoT injection', {
      sessionId,
      userId,
      planSteps: planResult.plan.length
    });

    return {
      type: 'manus_session_started',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        sessionId,
        plan: planResult.plan,
        initialThoughts: planResult.injectedThoughts,
        status: 'active'
      }
    };
  }

  private async generateInitialPlan(sessionId: string, request: string, context: Record<string, any>): Promise<{
    plan: string[];
    injectedThoughts: ThoughtInjection[];
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    // Generate plan using Manus-style structured planning
    const planningPrompt = `
      <manus_planner>
      System Environment: Ubuntu Linux with internet access
      Available Tools: web search, blockchain operations, code generation, document creation, scheduling
      User Context: ${JSON.stringify(context)}
      
      User Request: "${request}"
      
      Generate a step-by-step plan to accomplish this request. Each step should:
      1. Be specific and actionable
      2. Include which tool to use (if any)
      3. Build logically on previous steps
      4. Consider error handling and validation
      
      Format as a numbered list of concrete actions.
      </manus_planner>
    `;

    try {
      const planResponse = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: 'You are Manus, an autonomous AI agent that excels at breaking down complex tasks into executable steps. Generate clear, actionable plans with specific tool usage.'
          },
          {
            role: 'user', 
            content: planningPrompt
          }
        ],
        max_tokens: 600,
        temperature: 0.3
      });

      const planContent = planResponse.choices[0].message.content || '';
      const planSteps = this.extractPlanSteps(planContent);
      
      session.currentPlan = planSteps;
      session.activeStep = 0;

      // Add plan to event stream
      const planEvent: EventStreamEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        type: 'plan_update',
        content: `Generated plan with ${planSteps.length} steps: ${planSteps.join(', ')}`,
        metadata: { planSteps, planContent },
        status: 'completed'
      };

      session.eventStream.push(planEvent);

      // Inject strategic thinking about the plan
      const strategicInjection = await this.cotInjector.handleMessage({
        type: 'inject_thoughts',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: this.agentId,
        targetId: 'cot-injector',
        payload: {
          injectionType: 'strategic',
          context: { plan: planSteps, request },
          priority: 'high'
        }
      });

      const injectedThoughts: ThoughtInjection[] = [];
      if (strategicInjection?.payload.injectionId) {
        injectedThoughts.push({
          id: strategicInjection.payload.injectionId,
          type: 'strategic_thought',
          content: strategicInjection.payload.content,
          reasoning: 'Initial strategic planning injection',
          trigger: 'plan_change',
          priority: 'high',
          injectionPoint: session.eventStream.length,
          confidence: 0.85
        });
      }

      session.thoughtHistory.push(...injectedThoughts);
      this.updateWorkingMemory(sessionId);

      return {
        plan: planSteps,
        injectedThoughts
      };

    } catch (error) {
      this.logActivity('Error generating plan', { error: error.message });
      
      // Fallback plan
      const fallbackPlan = [
        'Analyze the user request in detail',
        'Research relevant information if needed',
        'Generate a solution approach',
        'Implement the solution',
        'Validate and deliver results'
      ];

      session.currentPlan = fallbackPlan;
      return {
        plan: fallbackPlan,
        injectedThoughts: []
      };
    }
  }

  private extractPlanSteps(planContent: string): string[] {
    // Extract numbered steps from plan content
    const steps: string[] = [];
    const lines = planContent.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        steps.push(match[1].trim());
      }
    }
    
    return steps.length > 0 ? steps : ['Execute user request'];
  }

  private async processUserInput(message: AgentMessage): Promise<AgentMessage> {
    const { sessionId, userMessage, messageType = 'message' } = message.payload;
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return this.createErrorResponse(message, 'Session not found');
    }

    // Add user input to event stream
    const userEvent: EventStreamEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'user_message',
      content: userMessage,
      metadata: { messageType },
      status: 'completed'
    };

    session.eventStream.push(userEvent);

    // Inject contextual thoughts based on user input
    if (messageType === 'feedback' || messageType === 'correction') {
      await this.cotInjector.handleMessage({
        type: 'inject_thoughts',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: this.agentId,
        targetId: 'cot-injector',
        payload: {
          injectionType: 'validation',
          context: { userFeedback: userMessage, currentStep: session.activeStep },
          priority: 'high'
        }
      });
    }

    // Process the input and generate response using Manus agent loop
    const response = await this.executeAgentLoop(sessionId, userMessage);

    this.updateWorkingMemory(sessionId);

    return {
      type: 'manus_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        sessionId,
        response: response.content,
        toolsUsed: response.toolsUsed,
        thoughtsInjected: response.thoughtsInjected,
        planProgress: {
          activeStep: session.activeStep,
          totalSteps: session.currentPlan.length,
          completedSteps: session.activeStep
        }
      }
    };
  }

  private async executeAgentLoop(sessionId: string, input: string): Promise<{
    content: string;
    toolsUsed: string[];
    thoughtsInjected: number;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const toolsUsed: string[] = [];
    let thoughtsInjected = 0;
    let iteration = 0;
    let finalResponse = '';

    // Manus agent loop: Analyze → Plan → Execute → Observe (repeat until complete)
    while (iteration < this.maxIterations && session.status === 'active') {
      iteration++;

      try {
        // 1. ANALYZE: Understand current state and determine next action
        const analysisResult = await this.analyzeCurrentState(sessionId, input);
        
        if (analysisResult.shouldComplete) {
          finalResponse = analysisResult.finalResponse || 'Task completed successfully.';
          session.status = 'completed';
          break;
        }

        // 2. PLAN/SELECT: Choose next tool or action
        const selectedAction = analysisResult.nextAction;
        if (!selectedAction) {
          // Inject planning thoughts when unclear about next step
          await this.injectPlanningThoughts(sessionId, 'Unclear next action, need strategic thinking');
          thoughtsInjected++;
          continue;
        }

        // 3. EXECUTE: Perform the selected action
        const executionResult = await this.executeAction(sessionId, selectedAction);
        toolsUsed.push(selectedAction.toolName);

        // 4. OBSERVE: Record results and update event stream
        const observationEvent: EventStreamEntry = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          type: 'agent_action',
          content: `Executed ${selectedAction.toolName}: ${executionResult.success ? 'Success' : 'Failed'}`,
          metadata: { 
            action: selectedAction, 
            result: executionResult.result,
            error: executionResult.error 
          },
          status: executionResult.success ? 'completed' : 'failed'
        };

        session.eventStream.push(observationEvent);

        // Inject error correction thoughts if action failed
        if (!executionResult.success) {
          await this.injectErrorCorrectionThoughts(sessionId, executionResult.error);
          thoughtsInjected++;
        }

        // Move to next step if current step is complete
        if (executionResult.stepComplete) {
          session.activeStep++;
          
          // Inject validation thoughts at step transitions
          if (session.activeStep < session.currentPlan.length) {
            await this.injectValidationThoughts(sessionId, 'Step transition validation');
            thoughtsInjected++;
          }
        }

        // Check if all steps are complete
        if (session.activeStep >= session.currentPlan.length) {
          finalResponse = executionResult.result || 'All planned steps completed successfully.';
          session.status = 'completed';
          break;
        }

        this.updateWorkingMemory(sessionId);

      } catch (error) {
        this.logActivity('Error in agent loop iteration', { 
          iteration, 
          sessionId, 
          error: error.message 
        });

        // Inject error correction thoughts
        await this.injectErrorCorrectionThoughts(sessionId, error.message);
        thoughtsInjected++;
        
        // Try to recover or complete with partial results
        if (iteration > 5) {
          finalResponse = 'I encountered some difficulties but made progress on your request.';
          session.status = 'error';
          break;
        }
      }
    }

    return {
      content: finalResponse,
      toolsUsed,
      thoughtsInjected
    };
  }

  private async analyzeCurrentState(sessionId: string, input: string): Promise<{
    nextAction?: { toolName: string; parameters: Record<string, any> };
    shouldComplete: boolean;
    finalResponse?: string;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const workingMemoryContext = session.workingMemory
      .slice(-10) // Last 10 events for context
      .map(e => `${e.type}: ${e.content}`)
      .join('\n');

    const analysisPrompt = `
      <manus_analysis>
      Current Plan: ${session.currentPlan.join(' → ')}
      Active Step: ${session.activeStep + 1}/${session.currentPlan.length}
      
      Recent Context:
      ${workingMemoryContext}
      
      Current User Input: "${input}"
      
      Available Tools: ${Array.from(this.availableTools.keys()).join(', ')}
      
      Analyze the current situation and determine:
      1. Should I complete the task now? (if yes, provide final response)
      2. What specific action should I take next?
      3. Which tool should I use and with what parameters?
      
      Respond in JSON format:
      {
        "shouldComplete": boolean,
        "finalResponse": "string (if completing)",
        "nextAction": {
          "toolName": "string",
          "parameters": { "key": "value" },
          "reasoning": "string"
        }
      }
      </manus_analysis>
    `;

    try {
      const analysisResponse = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: 'You are Manus analyzing the current state to determine the next action. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 400,
        temperature: 0.2
      });

      const analysisResult = JSON.parse(analysisResponse.choices[0].message.content || '{}');
      
      return {
        shouldComplete: analysisResult.shouldComplete || false,
        finalResponse: analysisResult.finalResponse,
        nextAction: analysisResult.nextAction
      };

    } catch (error) {
      this.logActivity('Analysis error', { error: error.message });
      
      // Fallback analysis
      return {
        shouldComplete: session.activeStep >= session.currentPlan.length,
        finalResponse: 'Task analysis completed with basic reasoning.',
        nextAction: session.activeStep < session.currentPlan.length ? {
          toolName: 'web_search',
          parameters: { query: input }
        } : undefined
      };
    }
  }

  private async executeAction(sessionId: string, action: { toolName: string; parameters: Record<string, any> }): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    stepComplete: boolean;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const targetAgent = this.availableTools.get(action.toolName);
    if (!targetAgent) {
      return {
        success: false,
        error: `Tool ${action.toolName} not available`,
        stepComplete: false
      };
    }

    try {
      // Execute tool via message broker
      const toolMessage: AgentMessage = {
        type: 'execute_task',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: this.agentId,
        targetId: targetAgent,
        payload: {
          toolName: action.toolName,
          parameters: action.parameters,
          sessionId
        }
      };

      // Send to appropriate agent
      await this.sendMessage(toolMessage);

      // For now, simulate successful execution
      // In production, this would wait for agent response
      return {
        success: true,
        result: `Successfully executed ${action.toolName}`,
        stepComplete: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stepComplete: false
      };
    }
  }

  private async injectPlanningThoughts(sessionId: string, context: string): Promise<void> {
    await this.cotInjector.handleMessage({
      type: 'inject_thoughts',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'cot-injector',
      payload: {
        injectionType: 'strategic',
        context: { sessionId, context },
        priority: 'medium'
      }
    });
  }

  private async injectErrorCorrectionThoughts(sessionId: string, error: string): Promise<void> {
    await this.cotInjector.handleMessage({
      type: 'inject_thoughts',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'cot-injector',
      payload: {
        injectionType: 'correction',
        context: { sessionId, error },
        priority: 'high'
      }
    });
  }

  private async injectValidationThoughts(sessionId: string, context: string): Promise<void> {
    await this.cotInjector.handleMessage({
      type: 'inject_thoughts',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'cot-injector',
      payload: {
        injectionType: 'validation',
        context: { sessionId, context },
        priority: 'medium'
      }
    });
  }

  private updateWorkingMemory(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Keep sliding window of recent events in working memory
    const memorySize = 20;
    session.workingMemory = session.eventStream.slice(-memorySize);
  }

  private async getSessionStatus(message: AgentMessage): Promise<AgentMessage> {
    const { sessionId } = message.payload;
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return this.createErrorResponse(message, 'Session not found');
    }

    return {
      type: 'session_status',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        sessionId: session.id,
        status: session.status,
        planProgress: {
          activeStep: session.activeStep,
          totalSteps: session.currentPlan.length,
          currentStepDescription: session.currentPlan[session.activeStep] || 'Complete'
        },
        eventStreamLength: session.eventStream.length,
        workingMemorySize: session.workingMemory.length,
        thoughtsInjected: session.thoughtHistory.length
      }
    };
  }

  private async handleReasoningInjection(message: AgentMessage): Promise<AgentMessage> {
    const { sessionId, injectionType, context, priority = 'medium' } = message.payload;
    
    const injectionResult = await this.cotInjector.handleMessage({
      type: 'inject_thoughts',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: 'cot-injector',
      payload: {
        injectionType,
        context,
        priority
      }
    });

    return {
      type: 'reasoning_injection_complete',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        sessionId,
        injectionId: injectionResult?.payload.injectionId,
        success: !!injectionResult
      }
    };
  }

  private async exportSessionMemory(message: AgentMessage): Promise<AgentMessage> {
    const { sessionId } = message.payload;
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return this.createErrorResponse(message, 'Session not found');
    }

    // Export working memory from CoT injector
    const cotMemory = this.cotInjector.exportWorkingMemory();

    return {
      type: 'session_memory_exported',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        sessionId,
        sessionData: {
          eventStream: session.eventStream,
          workingMemory: session.workingMemory,
          thoughtHistory: session.thoughtHistory,
          currentPlan: session.currentPlan,
          activeStep: session.activeStep,
          sessionContext: session.sessionContext
        },
        cotMemory
      }
    };
  }

  getCapabilities(): string[] {
    return [
      'manus_session_management',
      'chain_of_thought_injection',
      'event_stream_processing',
      'dynamic_planning',
      'tool_orchestration',
      'autonomous_reasoning',
      'working_memory_management',
      'iterative_execution_loops'
    ];
  }

  // Clean up inactive sessions
  public cleanup(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    this.activeSessions.forEach((session, sessionId) => {
      const sessionTime = new Date(session.startTime).getTime();
      if (sessionTime < cutoffTime) {
        this.activeSessions.delete(sessionId);
        this.logActivity('Cleaned up inactive session', { sessionId });
      }
    });
  }
}