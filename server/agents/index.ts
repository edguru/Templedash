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
import { ChainGPTMCP } from './mcps/ChainGPTMCP';
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

    // Initialize unified GOAT agent and other specialized agents with enhanced debugging
    console.log('[DEBUG] Starting specialized agent initialization...');
    try {
      console.log('[DEBUG] Attempting to import UnifiedGoatAgent...');
      const { UnifiedGoatAgent } = await import('./blockchain/UnifiedGoatAgent');
      console.log('[DEBUG] UnifiedGoatAgent imported successfully');
      
      console.log('[DEBUG] Attempting to import ResearchAgent...');
      const { ResearchAgent } = await import('./crewai/ResearchAgent');
      console.log('[DEBUG] ResearchAgent imported successfully');
      
      console.log('[DEBUG] Attempting to import CodeGenerationAgent...');
      const { CodeGenerationAgent } = await import('./crewai/CodeGenerationAgent');
      console.log('[DEBUG] CodeGenerationAgent imported successfully');
      
      console.log('[DEBUG] Creating UnifiedGoatAgent instance...');
      const unifiedGoatAgent = new UnifiedGoatAgent(this.messageBroker);
      console.log('[DEBUG] UnifiedGoatAgent instance created successfully');
      
      console.log('[DEBUG] Creating ResearchAgent instance...');
      const researchAgent = new ResearchAgent(this.messageBroker);
      console.log('[DEBUG] ResearchAgent instance created successfully');
      
      console.log('[DEBUG] Creating CodeGenerationAgent instance...');
      const codeGenerationAgent = new CodeGenerationAgent(this.messageBroker);
      console.log('[DEBUG] CodeGenerationAgent instance created successfully');
      
      // Register specialized agents
      console.log('[DEBUG] Registering goat-agent...');
      this.registry.register('goat-agent', unifiedGoatAgent);
      console.log('[DEBUG] goat-agent registered successfully');
      
      this.registry.register('research-agent', researchAgent);
      this.registry.register('code-generation-agent', codeGenerationAgent);
      
      console.log('✅ Unified GOAT agent and specialized agents initialized successfully');
      console.log('[DEBUG] All specialized agents registered in registry');
    } catch (error) {
      console.error('❌ Specialized agents initialization failed with detailed error:');
      console.error('Error message:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.log('⚠️ Falling back to MCP agents only');
    }

    // Register remaining MCP agents (GoatMCP removed - replaced by UnifiedGoatAgent)
    const codeGenMCP = new CodeGenMCP(this.messageBroker);
    const documentWriterMCP = new DocumentWriterMCP(this.messageBroker);
    const nebulaMCP = new NebulaMCP(this.messageBroker);
    const researchMCP = new ResearchMCP(this.messageBroker);
    const schedulerMCP = new SchedulerMCP(this.messageBroker);
    const chainGPTMCP = new ChainGPTMCP(this.messageBroker);

    // Register all agents
    this.registry.register('companion-handler', companionHandler);
    this.registry.register('prompt-engineer', promptEngineer);
    this.registry.register('task-analyzer', taskAnalyzer);
    this.registry.register('task-orchestrator', taskOrchestrator);
    this.registry.register('task-tracker', taskTracker);
    this.registry.register('profile-memory', profileMemory);
    this.registry.register('user-experience', userExperience);

    // Note: CrewAI agents are registered above in the try block

    // Register MCP agents (goat-mcp replaced by unified goat-agent)
    this.registry.register('codegen-mcp', codeGenMCP);
    this.registry.register('docwriter-mcp', documentWriterMCP);
    this.registry.register('nebula-mcp', nebulaMCP);
    this.registry.register('research-mcp', researchMCP);
    this.registry.register('scheduler-mcp', schedulerMCP);
    this.registry.register('chaingpt-mcp', chainGPTMCP);
    
    // Register CrewAI Chain of Thought System (only BaseAgent instances)
    this.registry.register('crewai-orchestrator', this.crewaiOrchestrator);
    this.registry.register('react-agent', this.reactAgent);
    // Note: cotEngine is not a BaseAgent, so it's not registered in the registry

    console.log('Agent system initialized with', this.registry.getAllAgents().length, 'agents');
  }

  async processUserMessage(userId: string, message: string, conversationId: string, walletAddress?: string) {
    return this.orchestrator.processUserMessage(userId, message, conversationId, walletAddress);
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

  // Chat History Management - Access ChatContextManager through CompanionHandler
  getChatContextManager() {
    const companionHandler = this.registry.getAgent('companion-handler');
    if (companionHandler && 'getChatContextManager' in companionHandler) {
      return (companionHandler as any).getChatContextManager();
    }
    throw new Error('ChatContextManager not available - CompanionHandler not found');
  }

  // Transaction confirmation - delegate to NebulaMCP
  async confirmTransaction(transactionId: string, transactionHash: string, isCompanionNFT: boolean = false) {
    const nebulaMCP = this.registry.getAgent('nebula-mcp') as NebulaMCP;
    if (!nebulaMCP || !('confirmTransaction' in nebulaMCP)) {
      throw new Error('NebulaMCP not available for transaction confirmation');
    }
    return (nebulaMCP as any).confirmTransaction(transactionId, transactionHash, isCompanionNFT);
  }

  async shutdown() {
    console.log('Shutting down agent system...');
    await this.orchestrator.shutdown();
    this.messageBroker.shutdown();
  }
}

export default AgentSystem;