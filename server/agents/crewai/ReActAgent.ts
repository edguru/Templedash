// ReAct (Reasoning and Acting) Pattern Implementation for CrewAI Integration
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { ChainOfThoughtEngine, ReasoningContext } from './ChainOfThoughtEngine';
import { CrewAIAgent, ChainOfThoughtStep } from './CrewAIOrchestrator';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

export interface ReActState {
  observation: string;
  thought: string;
  action: string;
  actionInput: any;
  observation_result: string;
  scratchpad: string[];
  iteration: number;
  max_iterations: number;
  completed: boolean;
}

export interface ToolCall {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export class ReActAgent extends BaseAgent {
  private openai: OpenAI;
  private cotEngine: ChainOfThoughtEngine;
  private crewAgent: CrewAIAgent;
  private availableTools: Map<string, ToolCall> = new Map();
  private currentState: ReActState;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(
    agentId: string,
    messageBroker: MessageBroker,
    crewAgent: CrewAIAgent,
    cotEngine: ChainOfThoughtEngine
  ) {
    super(agentId, messageBroker);
    this.crewAgent = crewAgent;
    this.cotEngine = cotEngine;
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    this.currentState = {
      observation: '',
      thought: '',
      action: '',
      actionInput: {},
      observation_result: '',
      scratchpad: [],
      iteration: 0,
      max_iterations: 10,
      completed: false
    };

    this.initializeTools();
  }

  protected initialize(): void {
    this.logActivity('Initializing ReAct Agent', { 
      role: this.crewAgent.role,
      reasoningStyle: this.crewAgent.reasoningStyle 
    });
  }

  private initializeTools(): void {
    // Web Search Tool
    this.availableTools.set('web_search', {
      name: 'web_search',
      description: 'Search the web for information on a specific topic',
      parameters: { query: 'string' },
      execute: async (params) => {
        // Mock implementation - would integrate with actual search API
        return `Search results for "${params.query}": [Relevant information would be returned here]`;
      }
    });

    // Code Analysis Tool
    this.availableTools.set('analyze_code', {
      name: 'analyze_code',
      description: 'Analyze code for quality, security, and best practices',
      parameters: { code: 'string', language: 'string' },
      execute: async (params) => {
        // Mock implementation - would use static analysis tools
        return `Code analysis for ${params.language}: Quality score: 85%, Security issues: 2 minor, Best practices: 8/10`;
      }
    });

    // Blockchain Query Tool
    this.availableTools.set('blockchain_query', {
      name: 'blockchain_query',
      description: 'Query blockchain data and smart contract information',
      parameters: { network: 'string', query_type: 'string', address: 'string' },
      execute: async (params) => {
        // Mock implementation - would integrate with blockchain APIs
        return `Blockchain query on ${params.network}: ${params.query_type} for ${params.address}`;
      }
    });

    // Task Planning Tool
    this.availableTools.set('create_plan', {
      name: 'create_plan',
      description: 'Create a structured plan for complex tasks',
      parameters: { task: 'string', constraints: 'array', resources: 'array' },
      execute: async (params) => {
        // Mock implementation - would use planning algorithms
        return `Strategic plan created for: ${params.task}. Steps: 1) Analysis, 2) Design, 3) Implementation, 4) Testing, 5) Deployment`;
      }
    });

    this.logActivity('Tools initialized', { toolCount: this.availableTools.size });
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    switch (message.type) {
      case 'react_task_request':
        return this.handleReActTask(message);
      case 'react_continue':
        return this.continueReAct(message);
      case 'react_status':
        return this.getReActStatus(message);
      default:
        return null;
    }
  }

  private async handleReActTask(message: AgentMessage): Promise<AgentMessage> {
    const { task, context, max_iterations } = message.payload;
    
    // Reset state for new task
    this.currentState = {
      observation: '',
      thought: '',
      action: '',
      actionInput: {},
      observation_result: '',
      scratchpad: [],
      iteration: 0,
      max_iterations: max_iterations || 10,
      completed: false
    };

    this.conversationHistory = [
      {
        role: 'system',
        content: this.buildSystemPrompt()
      }
    ];

    // Start ReAct reasoning loop
    const result = await this.executeReActLoop(task, context);

    return {
      type: 'react_task_complete',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        result,
        iterations: this.currentState.iteration,
        reasoning_chain: this.currentState.scratchpad,
        final_state: this.currentState
      }
    };
  }

  private async executeReActLoop(task: string, context: any): Promise<any> {
    this.currentState.observation = `Task: ${task}\nContext: ${JSON.stringify(context, null, 2)}`;
    this.logReAct('observation', this.currentState.observation);

    while (!this.currentState.completed && this.currentState.iteration < this.currentState.max_iterations) {
      this.currentState.iteration++;
      
      try {
        // THOUGHT step
        const thought = await this.generateThought();
        this.currentState.thought = thought;
        this.logReAct('thought', thought);

        // Check if we should finish
        if (this.shouldFinish(thought)) {
          this.currentState.completed = true;
          break;
        }

        // ACTION step
        const { action, actionInput } = await this.generateAction(thought);
        this.currentState.action = action;
        this.currentState.actionInput = actionInput;
        this.logReAct('action', `${action} with input: ${JSON.stringify(actionInput)}`);

        // OBSERVATION step (execute action)
        const observation = await this.executeAction(action, actionInput);
        this.currentState.observation_result = observation;
        this.currentState.observation = observation;
        this.logReAct('observation', observation);

      } catch (error) {
        this.logActivity('ReAct loop error', { error: error.message });
        this.currentState.observation = `Error: ${error.message}`;
        this.logReAct('observation', this.currentState.observation);
      }
    }

    return this.generateFinalAnswer();
  }

  private buildSystemPrompt(): string {
    return `You are ${this.crewAgent.role} with the following characteristics:
- Goal: ${this.crewAgent.goal}
- Backstory: ${this.crewAgent.backstory}
- Reasoning Style: ${this.crewAgent.reasoningStyle}
- Available Tools: ${Array.from(this.availableTools.keys()).join(', ')}

You should use the ReAct (Reasoning and Acting) pattern:
1. Thought: Think about what you need to do next
2. Action: Choose and execute an action using available tools
3. Observation: Observe the results and think about next steps

Available Actions:
${Array.from(this.availableTools.entries()).map(([name, tool]) => 
  `- ${name}: ${tool.description}`
).join('\n')}

Always format your responses clearly showing your thinking process.
Use "Thought:" for reasoning, "Action:" for tool usage, and "Observation:" for results.

When you have enough information to complete the task, use "Final Answer:" to provide your conclusion.`;
  }

  private async generateThought(): Promise<string> {
    const prompt = this.buildThoughtPrompt();
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          ...this.conversationHistory,
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const thought = response.choices[0].message.content?.trim() || 'Unable to generate thought';
      
      // Add to conversation history
      this.conversationHistory.push({ role: 'user', content: prompt });
      this.conversationHistory.push({ role: 'assistant', content: thought });
      
      return thought;
    } catch (error) {
      this.logActivity('Error generating thought', { error: error.message });
      return `Error in thought generation: ${error.message}`;
    }
  }

  private buildThoughtPrompt(): string {
    const scratchpadSummary = this.currentState.scratchpad.slice(-5).join('\n');
    
    return `Current situation:
Observation: ${this.currentState.observation}
Previous reasoning: ${scratchpadSummary}

What should I think about next? Consider:
- What information do I have?
- What information do I still need?
- What would be the most logical next step?
- Am I close to solving the task?

Provide your thought process clearly.`;
  }

  private async generateAction(thought: string): Promise<{ action: string; actionInput: any }> {
    const prompt = `Based on this thought: "${thought}"

Available actions: ${Array.from(this.availableTools.keys()).join(', ')}

What action should I take? Format your response as:
Action: [action_name]
Action Input: [input_parameters_as_json]

If you think you have enough information to provide a final answer, use:
Action: final_answer
Action Input: {"answer": "your final answer"}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          ...this.conversationHistory,
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.5
      });

      const actionText = response.choices[0].message.content?.trim() || '';
      
      // Parse action and input
      const actionMatch = actionText.match(/Action:\s*(.+)/);
      const inputMatch = actionText.match(/Action Input:\s*(.+)/);
      
      const action = actionMatch ? actionMatch[1].trim() : 'final_answer';
      let actionInput = {};
      
      if (inputMatch) {
        try {
          actionInput = JSON.parse(inputMatch[1].trim());
        } catch {
          actionInput = { input: inputMatch[1].trim() };
        }
      }

      return { action, actionInput };
    } catch (error) {
      this.logActivity('Error generating action', { error: error.message });
      return { action: 'final_answer', actionInput: { answer: `Error: ${error.message}` } };
    }
  }

  private async executeAction(action: string, actionInput: any): Promise<string> {
    if (action === 'final_answer') {
      this.currentState.completed = true;
      return `Final Answer: ${actionInput.answer || actionInput.input || 'Task completed'}`;
    }

    const tool = this.availableTools.get(action);
    if (!tool) {
      return `Error: Unknown action "${action}". Available actions: ${Array.from(this.availableTools.keys()).join(', ')}`;
    }

    try {
      const result = await tool.execute(actionInput);
      return `Action "${action}" executed successfully. Result: ${result}`;
    } catch (error) {
      return `Error executing action "${action}": ${error.message}`;
    }
  }

  private shouldFinish(thought: string): boolean {
    const finishIndicators = [
      'i have enough information',
      'task is complete',
      'final answer',
      'conclusion',
      'finished',
      'done'
    ];

    return finishIndicators.some(indicator => 
      thought.toLowerCase().includes(indicator)
    );
  }

  private async generateFinalAnswer(): Promise<string> {
    const prompt = `Based on all the reasoning and actions performed:
${this.currentState.scratchpad.join('\n')}

Please provide a comprehensive final answer that addresses the original task.
Include:
1. Summary of your findings
2. Key insights from your reasoning process
3. Final recommendation or conclusion
4. Confidence level in your answer`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          ...this.conversationHistory,
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      return response.choices[0].message.content?.trim() || 'Unable to generate final answer';
    } catch (error) {
      this.logActivity('Error generating final answer', { error: error.message });
      return `Final answer generation error: ${error.message}`;
    }
  }

  private logReAct(step: string, content: string): void {
    const logEntry = `[Step ${this.currentState.iteration}] ${step.toUpperCase()}: ${content}`;
    this.currentState.scratchpad.push(logEntry);
    this.logActivity('ReAct Step', { step, iteration: this.currentState.iteration });
  }

  private async continueReAct(message: AgentMessage): Promise<AgentMessage> {
    if (this.currentState.completed) {
      return {
        type: 'react_already_complete',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        payload: {
          message: 'ReAct reasoning already completed',
          final_answer: this.currentState.scratchpad[this.currentState.scratchpad.length - 1]
        }
      };
    }

    // Continue with one more iteration
    const continueResult = await this.executeReActLoop(
      message.payload.task || 'Continue previous task',
      message.payload.context || {}
    );

    return {
      type: 'react_continued',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        result: continueResult,
        iterations: this.currentState.iteration,
        completed: this.currentState.completed
      }
    };
  }

  private async getReActStatus(message: AgentMessage): Promise<AgentMessage> {
    return {
      type: 'react_status_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload: {
        current_iteration: this.currentState.iteration,
        max_iterations: this.currentState.max_iterations,
        completed: this.currentState.completed,
        current_state: {
          latest_thought: this.currentState.thought,
          latest_action: this.currentState.action,
          latest_observation: this.currentState.observation
        },
        scratchpad_length: this.currentState.scratchpad.length,
        available_tools: Array.from(this.availableTools.keys())
      }
    };
  }

  getCapabilities(): string[] {
    return [
      'react-reasoning',
      'chain-of-thought',
      'tool-usage',
      'iterative-problem-solving',
      ...this.crewAgent.capabilities
    ];
  }

  // Method to add custom tools dynamically
  public addTool(name: string, tool: ToolCall): void {
    this.availableTools.set(name, tool);
    this.logActivity('Tool added', { toolName: name });
  }

  // Method to get reasoning history for analysis
  public getReasoningHistory(): {
    iterations: number;
    scratchpad: string[];
    final_state: ReActState;
  } {
    return {
      iterations: this.currentState.iteration,
      scratchpad: [...this.currentState.scratchpad],
      final_state: { ...this.currentState }
    };
  }

  // Method to export reasoning chain for CrewAI integration
  public exportReasoningChain(): ChainOfThoughtStep[] {
    const steps: ChainOfThoughtStep[] = [];
    let stepNumber = 1;

    for (let i = 0; i < this.currentState.scratchpad.length; i++) {
      const entry = this.currentState.scratchpad[i];
      
      // Parse the step type from the scratchpad entry
      let stepType: 'observation' | 'thought' | 'action' | 'reflection' = 'thought';
      if (entry.includes('OBSERVATION:')) stepType = 'observation';
      else if (entry.includes('ACTION:')) stepType = 'action';
      else if (entry.includes('THOUGHT:')) stepType = 'thought';
      
      steps.push({
        stepNumber: stepNumber++,
        type: stepType,
        content: entry.split(':').slice(1).join(':').trim(),
        reasoning: `ReAct step generated through ${stepType} process`,
        confidence: this.calculateStepConfidence(entry),
        timestamp: new Date().toISOString(),
        agentId: this.agentId
      });
    }

    return steps;
  }

  private calculateStepConfidence(entry: string): number {
    // Simple confidence calculation based on entry content
    let confidence = 0.5;
    
    if (entry.includes('Error')) confidence -= 0.3;
    if (entry.includes('successfully')) confidence += 0.2;
    if (entry.includes('Final Answer')) confidence += 0.3;
    if (entry.length > 100) confidence += 0.1;
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }
}