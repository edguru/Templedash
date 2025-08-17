# Puppets AI Multi-Agent System Documentation

## Overview
The Puppets AI system implements a comprehensive multi-agent architecture powered by CrewAI with Manus AI-style chain of thought injection. The system combines 14 specialized agents working in harmony to provide intelligent companion chat and Web3 task automation.

## Architecture Summary
- **Total Agents**: 14 specialized agents
- **Core System**: Single CrewAI-powered orchestration with chain of thought injection
- **Reasoning Style**: Manus AI-style dynamic reasoning injection into working memory during execution
- **Integration**: OpenAI GPT-4o for advanced reasoning capabilities

## Agent Categories

### 1. Core CrewAI System (3 agents)

#### CrewAI Orchestrator (`crewai-orchestrator`)
- **Class**: `CrewAIOrchestrator`
- **Role**: Master coordinator for crew-based task execution
- **Capabilities**: `['crew-coordination', 'task-orchestration', 'chain-of-thought', 'multi-agent-reasoning']`
- **Features**: 
  - Coordinates 4 specialized crew agents (Senior Researcher, Strategic Planner, Web3 Executor, Creative Director)
  - Manages active reasoning chains and task dependencies
  - Implements sequential, hierarchical, and parallel processing modes
- **Reasoning Patterns**: ReAct, Strategic, Analytical, Validation

#### ReAct Agent (`react-agent`) 
- **Class**: `ReActAgent`
- **Role**: Individual agent with iterative reasoning capabilities
- **Capabilities**: `['react-reasoning', 'iterative-thinking', 'tool-usage', 'strategic-analysis']`
- **Features**:
  - Implements Reasoning → Acting → Observation cycle
  - Integrated with Chain of Thought Engine
  - Tools: Web search, code analysis, blockchain query
- **Reasoning Style**: ReAct pattern with confidence thresholds

#### Chain of Thought Engine (utility class)
- **Class**: `ChainOfThoughtEngine`
- **Role**: Reasoning pattern management and context injection
- **Features**:
  - Multiple reasoning patterns (ReAct, Strategic, Analytical, Creative)
  - Dynamic context management with sliding window
  - Event stream processing for chronological task logging

### 2. User Interface Agents (3 agents)

#### Companion Handler (`companion-handler`)
- **Class**: `CompanionHandler`
- **Role**: Primary user interaction and conversation management
- **Capabilities**: `['conversation', 'context-awareness', 'user-profiling', 'task-routing']`
- **Features**: Natural language processing, conversation flow management, task delegation

#### User Experience (`user-experience`)
- **Class**: `UserExperience`  
- **Role**: UI/UX optimization and user journey management
- **Capabilities**: `['ui-optimization', 'user-journey', 'feedback-analysis', 'accessibility']`
- **Features**: Interface adaptation, user behavior analysis, accessibility improvements

#### Profile Memory (`profile-memory`)
- **Class**: `ProfileMemory`
- **Role**: User context and preference management
- **Capabilities**: `['memory-management', 'user-profiling', 'preference-learning', 'context-retention']`
- **Features**: Persistent user context, preference learning, conversation history

### 3. Task Management Agents (3 agents)

#### Task Orchestrator (`task-orchestrator`)
- **Class**: `TaskOrchestrator`
- **Role**: Task prioritization and execution coordination
- **Capabilities**: `['task_orchestration', 'priority_management', 'mcp_coordination', 'workflow_execution', 'resource_allocation']`
- **Features**: 
  - Priority queue system (high/medium/low)
  - MCP agent coordination
  - Concurrent task execution (max 5 tasks)

#### Task Tracker (`task-tracker`)
- **Class**: `TaskTracker`
- **Role**: Task state management and progress monitoring
- **Capabilities**: `['task-tracking', 'state-management', 'progress-monitoring', 'completion-detection']`
- **Features**: Real-time task state updates, completion tracking, failure handling

#### Task Analyzer (`task-analyzer`)
- **Class**: `TaskAnalyzer`
- **Role**: Task analysis and complexity assessment
- **Capabilities**: `['task-analysis', 'complexity-assessment', 'requirement-extraction', 'feasibility-checking']`
- **Features**: Network status monitoring, task complexity analysis, requirement validation

### 4. Specialized MCP Agents (5 agents)

#### Goat MCP (`goat-mcp`)
- **Class**: `GoatMCP`
- **Role**: Blockchain operations and Web3 interactions
- **Capabilities**: `['blockchain-operations', 'smart-contracts', 'defi-protocols', 'nft-management']`
- **Features**: Multi-chain support, transaction execution, wallet management
- **Networks**: Base Camp testnet (chain ID: 123420001114)

#### Code Generation MCP (`codegen-mcp`)
- **Class**: `CodeGenMCP`
- **Role**: Code generation and software development tasks
- **Capabilities**: `['code-generation', 'code-analysis', 'refactoring', 'documentation']`
- **Features**: Multi-language support, code quality analysis, automated testing

#### Document Writer MCP (`docwriter-mcp`)
- **Class**: `DocumentWriterMCP`
- **Role**: Document creation and content generation
- **Capabilities**: `['document-creation', 'content-generation', 'formatting', 'template-management']`
- **Features**: Technical documentation, user guides, API documentation

#### Research MCP (`research-mcp`)
- **Class**: `ResearchMCP`
- **Role**: Information gathering and analysis
- **Capabilities**: `['research', 'data-gathering', 'analysis', 'summarization']`
- **Features**: Web research, data synthesis, competitive analysis

#### Scheduler MCP (`scheduler-mcp`)
- **Class**: `SchedulerMCP`
- **Role**: Task scheduling and workflow automation
- **Capabilities**: `['scheduling', 'workflow-automation', 'time-management', 'event-coordination']`
- **Features**: Automated task scheduling, calendar integration, workflow orchestration

## Chain of Thought Injection System

### Key Features
- **Dynamic Reasoning Injection**: Thoughts are injected into working memory during execution, not pre-planned
- **Event Stream Processing**: Chronological logging of all reasoning steps and decisions
- **Context Management**: Sliding window approach for maintaining relevant context
- **Pattern Matching**: Multiple reasoning patterns based on task type and complexity

### Reasoning Patterns

#### ReAct Pattern
- **Steps**: Observation → Thought → Action → Reflection
- **Use Cases**: Web3 operations, research tasks
- **Confidence Thresholds**: 0.6-0.8 depending on step type

#### Strategic Pattern  
- **Steps**: Analysis → Planning → Execution → Evaluation
- **Use Cases**: Complex multi-step tasks, business decisions
- **Features**: Long-term planning, resource allocation

#### Analytical Pattern
- **Steps**: Data Collection → Analysis → Synthesis → Conclusion
- **Use Cases**: Research, data analysis, problem-solving
- **Features**: Evidence-based reasoning, logical deduction

#### Validation Pattern
- **Steps**: Input Validation → Process Verification → Output Validation → Quality Check
- **Use Cases**: Critical operations, security-sensitive tasks
- **Features**: Error prevention, quality assurance

## Technical Implementation

### Message Broker System
- **Class**: `MessageBroker`
- **Features**: Event-driven communication, topic-based subscriptions, message routing
- **Message Types**: task_assignment, user_message, crewai_task, execute_task

### Agent Registry
- **Class**: `AgentRegistry`
- **Features**: Agent discovery, capability mapping, load balancing
- **Registration**: Automatic agent registration with capability detection

### Communication Flow
1. User input → Companion Handler
2. Task analysis → Task Analyzer  
3. Task routing → Task Orchestrator
4. Agent selection → CrewAI Orchestrator
5. Reasoning injection → Chain of Thought Engine
6. Execution → Specialized MCP agents
7. Response synthesis → User interface

### Integration Points
- **OpenAI GPT-4o**: Advanced reasoning when API key available
- **Thirdweb SDK**: Wallet integration and Web3 connectivity
- **Base Camp Network**: Blockchain operations (Chain ID: 123420001114)
- **PostgreSQL**: Task state persistence and user data

## Current Status
- ✅ All 14 agents initialized successfully
- ✅ CrewAI orchestration system operational  
- ✅ Chain of thought injection active
- ✅ OpenAI GPT-4o integration configured
- ✅ Message broker system running
- ✅ Task queue processing active
- ✅ Goat MCP configured for Base Camp network
- ✅ Session signer integration implemented
- ✅ Thirdweb wallet connection with automated session creation
- ✅ Updated login, chat, and home interfaces
- ✅ Backend API routes for session management
- ✅ Session key storage and management system

## Implementation Highlights

### Goat MCP Integration
- **Base Camp Network Support**: Full integration with Chain ID 123420001114
- **Session Signer Creation**: Automated private key generation for transactions
- **Viem Integration**: Wallet client configuration for blockchain operations
- **Future Goat SDK**: Ready for full plugin integration (ERC20, Uniswap)

### Session Management System
- **Automated Session Creation**: Creates 24-hour session keys on wallet connection
- **Secure Storage**: LocalStorage with expiration management
- **Backend Registration**: Session keys registered with Goat MCP agent
- **Permission-Based**: Configurable permissions for different transaction types

### Updated User Experience
- **Enhanced Login**: Features showcase with session setup progress
- **Smart Chat**: Automatic session detection and blockchain capability messaging
- **Seamless Flow**: Wallet connection → Session creation → Agent system ready

## Architecture Status
The system now provides a complete pipeline from wallet connection to automated blockchain task execution:

1. **User connects wallet** → Thirdweb authentication
2. **Session key created** → Automated 24-hour transaction permissions  
3. **Backend registration** → Goat MCP receives session signer
4. **Agent system ready** → Full blockchain automation capabilities
5. **Chain of thought reasoning** → Intelligent task execution with dynamic reasoning injection

## Next Phase Ready
The consolidated CrewAI system with Goat MCP integration is fully operational and ready for:
- Smart contract deployment automation
- NFT minting and management
- DeFi protocol interactions  
- Token transfers and swaps
- Complex multi-step Web3 workflows

All 14 agents are working in harmony with advanced chain of thought reasoning capabilities and secure blockchain transaction automation.