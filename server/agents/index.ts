// Central Agent System Entry Point
import { AgentOrchestrator } from './core/AgentOrchestrator';
import { MessageBroker } from './core/MessageBroker';
import { AgentRegistry } from './core/AgentRegistry';
import { CompanionHandler } from './companions/CompanionHandler';
import { PromptEngineer } from './analyzers/PromptEngineer';
import { TaskAnalyzer } from './analyzers/TaskAnalyzer';
import { TaskOrchestrator } from './orchestrators/TaskOrchestrator';
import { TaskTracker } from './trackers/TaskTracker';
import { ProfileMemory } from './memory/ProfileMemory';
import { UserExperience } from './interface/UserExperience';

// MCP Agents
import { GoatMCP } from './mcps/GoatMCP';
import { CodeGenMCP } from './mcps/CodeGenMCP';
import { DocumentWriterMCP } from './mcps/DocumentWriterMCP';
import { NebulaMCP } from './mcps/NebulaMCP';
import { ResearchMCP } from './mcps/ResearchMCP';
import { SchedulerMCP } from './mcps/SchedulerMCP';
import { CrewAIOrchestrator } from './crewai/CrewAIOrchestrator';
import { ChainOfThoughtEngine } from './crewai/ChainOfThoughtEngine';
import { ReActAgent } from './crewai/ReActAgent';

export class AgentSystem {
  private orchestrator: AgentOrchestrator;
  private messageBroker: MessageBroker;
  private registry: AgentRegistry;
  private crewaiOrchestrator: CrewAIOrchestrator;
  private cotEngine: ChainOfThoughtEngine;
  private reactAgent: ReActAgent;

  constructor() {
    this.messageBroker = new MessageBroker();
    this.registry = new AgentRegistry();
    this.cotEngine = new ChainOfThoughtEngine();
    
    // Create a default crew agent for ReAct
    const defaultCrewAgent = {
      id: 'react-crew-agent',
      role: 'Strategic Reasoning Agent',
      goal: 'Execute complex tasks using ReAct pattern with chain of thought injection',
      backstory: 'I am an AI agent specialized in reasoning and acting iteratively to solve complex problems.',
      capabilities: ['reasoning', 'analysis', 'tool_usage', 'chain_of_thought'],
      reasoningStyle: 'analytical' as const,
      tools: [],
      verbose: true,
      allowDelegation: false
    };
    
    this.reactAgent = new ReActAgent('react-agent', this.messageBroker, defaultCrewAgent, this.cotEngine);
    this.crewaiOrchestrator = new CrewAIOrchestrator(this.messageBroker);
    this.orchestrator = new AgentOrchestrator(this.messageBroker, this.registry);
    
    this.initializeAgents(); // Will be async but non-blocking
  }

  private async initializeAgents() {
    // Register core agents
    const profileMemory = new ProfileMemory(this.messageBroker);
    const companionHandler = new CompanionHandler(this.messageBroker);
    const promptEngineer = new PromptEngineer(this.messageBroker);
    const taskAnalyzer = new TaskAnalyzer(this.messageBroker);
    const taskTracker = new TaskTracker(this.messageBroker);
    const taskOrchestrator = new TaskOrchestrator(this.messageBroker, taskTracker);
    const userExperience = new UserExperience(this.messageBroker);

    // Initialize new CrewAI specialized agents (conditional loading to avoid import issues)
    try {
      const { BlockchainAgent } = await import('./crewai/BlockchainAgent');
      const { ResearchAgent } = await import('./crewai/ResearchAgent');
      const { CodeGenerationAgent } = await import('./crewai/CodeGenerationAgent');
      
      const blockchainAgent = new BlockchainAgent(this.messageBroker);
      const researchAgent = new ResearchAgent(this.messageBroker);
      const codeGenerationAgent = new CodeGenerationAgent(this.messageBroker);
      
      // Register new CrewAI specialized agents
      this.registry.register('blockchain-agent', blockchainAgent);
      this.registry.register('research-agent', researchAgent);
      this.registry.register('code-generation-agent', codeGenerationAgent);
      
      console.log('✅ CrewAI specialized agents initialized successfully');
    } catch (error) {
      console.log('⚠️ CrewAI agents not available, using legacy agents only:', error.message);
    }

    // Register MCP agents
    const goatMCP = new GoatMCP(this.messageBroker);
    const codeGenMCP = new CodeGenMCP(this.messageBroker);
    const documentWriterMCP = new DocumentWriterMCP(this.messageBroker);
    const nebulaMCP = new NebulaMCP(this.messageBroker);
    const researchMCP = new ResearchMCP(this.messageBroker);
    const schedulerMCP = new SchedulerMCP(this.messageBroker);

    // Register all agents
    this.registry.register('companion-handler', companionHandler);
    this.registry.register('prompt-engineer', promptEngineer);
    this.registry.register('task-analyzer', taskAnalyzer);
    this.registry.register('task-orchestrator', taskOrchestrator);
    this.registry.register('task-tracker', taskTracker);
    this.registry.register('profile-memory', profileMemory);
    this.registry.register('user-experience', userExperience);

    // Note: CrewAI agents are registered above in the try block

    // Register MCP agents
    this.registry.register('goat-mcp', goatMCP);
    this.registry.register('codegen-mcp', codeGenMCP);
    this.registry.register('docwriter-mcp', documentWriterMCP);
    this.registry.register('nebula-mcp', nebulaMCP);
    this.registry.register('research-mcp', researchMCP);
    this.registry.register('scheduler-mcp', schedulerMCP);
    
    // Register CrewAI Chain of Thought System (only BaseAgent instances)
    this.registry.register('crewai-orchestrator', this.crewaiOrchestrator);
    this.registry.register('react-agent', this.reactAgent);
    // Note: cotEngine is not a BaseAgent, so it's not registered in the registry

    console.log('Agent system initialized with', this.registry.getAllAgents().length, 'agents');
  }

  async processUserMessage(userId: string, message: string, conversationId: string) {
    return this.orchestrator.processUserMessage(userId, message, conversationId);
  }

  async getTaskStatus(taskId: string) {
    return this.orchestrator.getTaskStatus(taskId);
  }

  async getUserProfile(userId: string) {
    const profileAgent = this.registry.getAgent('profile-memory') as ProfileMemory;
    return profileAgent.getUserProfile(userId);
  }

  async getAllActiveTasks(userId: string) {
    const taskTracker = this.registry.getAgent('task-tracker') as TaskTracker;
    return taskTracker.getActiveTasks(userId);
  }

  async shutdown() {
    console.log('Shutting down agent system...');
    await this.orchestrator.shutdown();
    this.messageBroker.shutdown();
  }
}

export default AgentSystem;