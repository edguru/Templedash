# Multi-Agent Architecture Documentation

## Overview

The system implements a sophisticated multi-agent architecture powered by CrewAI with MCP (Model Context Protocol) integration. This architecture provides intelligent task delegation, specialized agent capabilities, and seamless coordination for complex operations.

## Architecture Components

### 1. Core Agent Framework

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Agent System                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  CompanionHandler│  │ TaskOrchestrator│  │ Message      │ │
│  │  (Primary)      │  │ (Coordination)  │  │ Broker       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                 Specialized Agent Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │Blockchain   │ │Research     │ │Code Generation          │ │
│  │Agent        │ │Agent        │ │Agent                    │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    MCP Agent Layer                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │GOAT MCP │ │Nebula   │ │CodeGen  │ │DocWriter│ │Research ││
│  │         │ │MCP      │ │MCP      │ │MCP      │ │MCP      ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2. Agent Categories

#### Core Agents (2)
- **CompanionHandler**: Primary conversation management and personality adaptation
- **TaskOrchestrator**: Intelligent task delegation and agent coordination

#### Specialized Agents (3)
- **BlockchainAgent**: Web3 operations, smart contracts, DeFi protocols
- **ResearchAgent**: Data analysis, market research, information synthesis
- **CodeGenerationAgent**: Software development, code review, technical solutions

#### MCP Agents (6)
- **GoatMCP**: Advanced DeFi operations with GOAT SDK
- **NebulaMCP**: AI-powered blockchain analysis and reasoning
- **CodeGenMCP**: Enterprise-level code generation with MCP protocol
- **DocumentWriterMCP**: Technical documentation and content creation
- **ResearchMCP**: Advanced research with MCP protocol integration
- **SchedulerMCP**: Task scheduling and automation management

#### Support Agents (5)
- **TaskAnalyzer**: Task classification and requirement analysis
- **TaskTracker**: Task state management and progress monitoring
- **ProfileMemory**: User profile and preference management
- **PromptEngineer**: Dynamic prompt optimization
- **UserExperience**: User experience optimization

#### Framework Agents (2)
- **CrewAIOrchestrator**: CrewAI framework coordination
- **ReActAgent**: ReAct reasoning pattern implementation

## Key Features

### 1. Intelligent Task Delegation

```typescript
// Task routing with capability matching
const taskFlow = {
  userMessage: "Check my CAMP balance",
  analysis: {
    type: "blockchain_operation",
    complexity: "low", 
    priority: "high"
  },
  routing: {
    selectedAgent: "blockchain-agent",
    reasoning: "Direct capability match for blockchain_operations",
    score: 0.96
  }
}
```

### 2. Chain of Thought Reasoning

The system implements Manus AI-style dynamic reasoning injection:

```typescript
const chainOfThought = [
  'Task Analysis: Check my CAMP balance for address 0x...',
  'Task Type: balance_check, Priority: high',
  'Selected Agent: blockchain-agent (score: 0.96)',
  'Agent Reasoning: Direct capability match for blockchain_operations',
  'Capability: blockchain_operations',
  'Expected Latency: 5000ms',
  'Success Rate: 92.0%'
]
```

### 3. Real-Time Data Integration

**CAMP Explorer API Integration:**
- Authentic balance data from https://basecamp.cloud.blockscout.com/
- Real-time USD value calculations
- Live transaction monitoring
- Network status tracking

### 4. Session Management

**Unified Session System:**
- Cross-agent context sharing
- Persistent session keys
- Automated transaction signing
- Secure key management with AWS KMS

## Agent Configuration

### Agent Definition Structure

```json
{
  "agent-name": {
    "name": "AgentClass",
    "type": "specialized|core|mcp|support|framework",
    "role": "Agent primary responsibility",
    "systemMessage": "Detailed system prompt and behavior definition",
    "capabilities": ["capability1", "capability2"],
    "tools": ["tool1", "tool2"],
    "priority": "critical|high|medium|low",
    "loadFactor": 0.0-1.0,
    "successRate": 0.0-1.0,
    "averageLatency": "milliseconds"
  }
}
```

### Capability Mapping

**Primary Capabilities:**
- `conversation_management`: Natural conversation handling
- `blockchain_operations`: Web3 and smart contract interactions
- `task_delegation`: Intelligent task routing
- `code_generation`: Software development assistance
- `research_analysis`: Data gathering and analysis
- `personality_adaptation`: Companion trait customization

**Advanced Capabilities:**
- `chain_of_thought`: Step-by-step reasoning
- `real_time_data`: Live API integration
- `cross_chain_operations`: Multi-blockchain support
- `ai_blockchain_analysis`: AI-powered insights
- `enterprise_solutions`: Production-grade implementations

## Message Flow Architecture

### 1. Message Broker System

```typescript
interface MessageTypes {
  user_message: "Initial user input"
  task_delegation: "Task routing between agents"
  agent_response: "Agent completion responses"
  task_complete: "Task finalization"
  blockchain_operation: "Web3 operation requests"
  companion_response: "Personality-based responses"
}
```

### 2. Agent Communication Pattern

```
User Input → CompanionHandler → TaskOrchestrator → Specialized Agent → Response
     ↑                                ↓                    ↓
     └─────────── Response Synthesis ←─────────────────────┘
```

### 3. Load Balancing and Performance

**Intelligent Load Management:**
- Real-time load factor monitoring
- Adaptive routing based on agent performance
- Priority queuing for critical tasks
- Graceful fallback chains

**Performance Metrics:**
- Average latency tracking
- Success rate monitoring  
- Concurrent task limits
- Resource utilization optimization

## Integration Points

### 1. Blockchain Integration

**Thirdweb SDK Integration:**
- Unified Web3 connectivity
- Smart contract interaction
- Transaction management
- Wallet integration

**GOAT SDK Integration:**
- Advanced DeFi operations
- Cross-chain functionality
- Yield farming protocols
- Liquidity management

### 2. AI Model Integration

**OpenAI GPT-4o Integration:**
- Latest model capabilities
- JSON response formatting
- Vision and multimodal support
- Advanced reasoning patterns

**Chain of Thought Enhancement:**
- Dynamic reasoning injection
- Context-aware decision making
- Multi-step problem solving
- Collaborative planning

### 3. Data Sources

**Real-Time APIs:**
- CAMP Explorer for blockchain data
- Market data feeds
- Network status monitoring
- Transaction verification

**Internal Systems:**
- User profile management
- Companion trait storage
- Task execution history
- Performance analytics

## Security and Reliability

### 1. Security Measures

**AWS KMS Integration:**
- Secure secret management
- Encrypted key storage
- Access control policies
- Audit trail logging

**Session Security:**
- Session key rotation
- Secure transaction signing
- User authentication verification
- Permission-based access

### 2. Error Handling

**Graceful Degradation:**
- Fallback agent chains
- Error recovery mechanisms
- Partial failure handling
- User-friendly error messages

**Monitoring and Alerts:**
- Real-time performance monitoring
- Error rate tracking
- Latency threshold alerts
- Capacity planning metrics

## Future Enhancements

### 1. Planned Features

- **Multi-Model Support**: Integration of additional AI models
- **Enhanced MCP Protocol**: Advanced MCP capabilities
- **Cross-Chain Expansion**: Support for additional blockchains
- **Advanced Analytics**: Machine learning-powered insights

### 2. Scalability Improvements

- **Horizontal Scaling**: Agent instance scaling
- **Caching Optimization**: Response caching strategies  
- **Database Optimization**: Query performance improvements
- **API Rate Limiting**: Smart throttling mechanisms

## Configuration Management

The system uses `server/config/agents.json` for centralized agent management:

- **Agent Registration**: Automatic agent discovery and registration
- **Capability Mapping**: Dynamic capability-to-agent matching
- **Performance Tuning**: Real-time parameter adjustments
- **Routing Rules**: Flexible message routing configuration

This architecture provides a robust, scalable, and intelligent multi-agent system capable of handling complex tasks while maintaining high performance and reliability.