# Overview

Puppet Runner is an NFT-powered infinite runner game that combines gaming mechanics with blockchain functionality. Players run through a 3D environment collecting coins and avoiding obstacles. The application's core focus has shifted to a personalized AI companion system, with the game itself becoming a mini-game feature. This project integrates NFT characters that affect gameplay, allowing players to earn rewards and unlock content through NFT ownership, all while interacting with an AI companion. The business vision is to blend interactive AI with Web3 gaming, offering unique, personalized experiences and leveraging blockchain for digital ownership and rewards.

## Recent Updates (January 26, 2025)
- **🚀 ENHANCED NEBULAMCP TRANSACTION FLOW**: Complete redesign with Thirdweb Engine transaction polling and improved manual signing fallback
- **✅ 3-Step Transaction Pipeline**: Auto-execution → Thirdweb Engine polling → Manual signing fallback with frontend transaction creation
- **✅ Enhanced Prompt Engineering**: Streamlined prompts with mandatory explorer URLs for read operations and Base Camp testnet defaults
- **✅ Transaction Status Monitoring**: Real-time polling using Thirdweb Engine API with 60-second timeout and 3-second intervals
- **✅ Seamless Manual Signing**: Frontend transaction preparation, user wallet signing, and automatic database updates upon confirmation
- **✅ Companion NFT Integration**: Automatic companion database creation upon successful NFT transaction confirmation
- **✅ Explorer URL Integration**: Automatic Base Camp explorer links for all transactions with monitoring capabilities
- **✅ Fixed Authentication**: Corrected Authorization header format for all Thirdweb API calls
- **🔒 STRICT DATA INTEGRITY ENFORCEMENT**: Implemented comprehensive rules preventing ANY false information generation across all 18 agents
- **✅ Authentic Data Only Policy**: Zero tolerance for mock, simulated, placeholder, or fake data - especially for wallet balances, transactions, and financial information
- **🎯 COMPREHENSIVE AGENT MANAGEMENT SYSTEM**: Created centralized JSON configuration for all 18 agents with roles, system messages, tools, and performance metrics
- **✅ Architecture Documentation**: Complete AGENT_ARCHITECTURE.md with detailed multi-agent system documentation, message flows, and integration points
- **✅ CrewAI Agent Delegation**: Successfully implemented end-to-end intelligent task delegation with specialized CrewAI agents
- **✅ BlockchainAgent Integration**: Complete blockchain operation handling with real CAMP explorer API integration for authentic USD values
- **✅ Real-Time Balance Data**: Integrated https://basecamp.cloud.blockscout.com/ API for authentic CAMP token balances and pricing data
- **✅ Enhanced Message Flow**: Fixed CompanionHandler to properly relay specialized agent responses back to users with 0.96 confidence scores
- **✅ Mandatory Companion Creation**: Implemented one-companion-per-user limit with NFT verification and mandatory creation before app access
- **✅ Database Cleanup**: Removed all existing companions from database to enforce fresh companion creation workflow
- **✅ Contract Address Updates**: Fixed CompanionNFT contract address from placeholder to deployed `0x742d35Cc6e2C3e312318508CF3c66E2E2B45A1b5`
- **✅ UI Text Corrections**: Changed "soulbound token" references to "NFT" throughout companion creation and prompt screens
- **🤖 AI-POWERED AGENT SELECTION**: Completely replaced CapabilityRegistry with IntelligentAgentSelector using OpenAI for natural language task analysis
- **✅ Natural Language Understanding**: TaskOrchestrator now analyzes agent descriptions and capabilities using AI instead of hardcoded patterns
- **✅ Intelligent Task Routing**: Agents selected based on AI analysis of task requirements, agent roles, and capabilities with confidence scoring
- **✅ Simplified Collaborative Planning**: Updated CollaborativePlanner to work with AI-powered agent selection while maintaining system compatibility
- **Previous System Enhanced**: All existing functionality (NFT minting, balance checking, task routing) maintained and significantly enhanced
- **CompanionNFT Contract**: Successfully deployed at address `0x742d35Cc6e2C3e312318508CF3c66E2E2B45A1b5` on Base Camp Testnet

# User Preferences

- **AI System**: Single CrewAI-powered multi-agent system with chain of thought injection (not multiple competing systems)
- **Chain of Thought**: Use Manus AI-style dynamic reasoning injection into working memory during execution
- **App Focus**: Companion chat and task automation as primary features, Puppet Runner as mini-game
- **Companion System**: Personalized AI companions with customizable traits minted as NFTs (one per user)
- **Design Style**: Clean, minimal interface inspired by wireframe - avoid excessive text
- **Communication**: Simple, everyday language
- **Authentication**: Email and wallet-based auth only via Thirdweb (no social login options)
- **Reward system**: Save token recipients for later claiming rather than immediate distribution
- **Network**: Base Camp testnet by Camp Network for all blockchain operations
- **System Prompts**: Detailed and accurate system prompts for all agents to ensure precise operation and enhanced performance
- **DATA INTEGRITY CRITICAL RULE**: Absolutely NO false, mock, simulated, placeholder, or fake information generation. All data must be from authentic sources ONLY. If real data unavailable, return clear error messages instead of fake data. This applies especially to wallet balances, transaction data, prices, and any financial information.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Main UI framework using functional components and hooks.
- **Three.js with React Three Fiber**: 3D graphics engine optimized for mobile performance, used for the Puppet Runner mini-game.
- **Zustand**: State management for application state, including companion traits, authentication, and NFT ownership.
- **Tailwind CSS with Radix UI**: Styling system for a clean, minimal interface with accessible components.
- **Vite**: Build tool and development server.
- **Mobile Optimization**: Implemented with reduced shadow quality, lower polygon models, and simplified lighting for mobile devices.

## Application Structure
- **Companion-First Design**: Primary focus is the Companion Chat system, with dedicated tabs for Chat, Tasks, Mini Games, and Account.
- **Comprehensive Companion Creation System**: UI for designing companion personality, relationship type, and traits (name, age, role, gender, flirtiness, intelligence, humor, loyalty, empathy).
- **Enhanced Companion Handler Agent**: A 15-agent system that includes personalized companion interactions, with personality-based responses and relationship-aware greetings.
- **User Flow Integration**: Seamless companion creation workflow for new and existing users, including NFT minting for companions (one per user only).
- **Web3 Task Management**: TasksScreen for Web3 automation workflows, priority levels, and category organization.
- **Gaming Hub**: MiniGamesScreen featuring Puppet Runner with stats, ratings, and rewards tracking.
- **Account Management**: AccountScreen for wallet management, game statistics, achievements, and settings.
- **Streamlined Login**: Simplified wallet connection page.

## Backend Architecture
- **Express.js**: RESTful API server.
- **PostgreSQL with Drizzle ORM**: Type-safe database operations with schema management.
- **Authentication**: Wallet-based authentication system for secure user sessions, primarily via Thirdweb.
- **Comprehensive API**: Supports game scores, leaderboards, token claims, and NFT ownership tracking.
- **Real Token Rewards**: Mystery box system for deferred crypto rewards based on performance.
- **18-Agent Multi-Agent System**: Complete CrewAI-powered intelligent task delegation architecture:
  - **Core Framework**: MessageBroker, IntelligentAgentSelector, TaskOrchestrator with AI-powered chain-of-thought reasoning
  - **Agent Categories**: 2 Core, 3 Specialized, 6 MCP, 5 Support, 2 Framework agents
  - **AI-Powered Selection**: Natural language understanding for task analysis and agent matching using OpenAI
  - **MCP Agent Suite**: GOAT, Nebula, CodeGen, DocumentWriter, Research, Scheduler with unified session management
  - **Centralized Configuration**: JSON-based agent management system with roles, capabilities, and performance metrics
  - **Real-Time Integration**: CAMP Explorer API for authentic blockchain data and USD values
  - **Session Management**: AWS KMS-secured session keys for unified blockchain operations across all agents

## Web3 Integration
- **Thirdweb v5 SDK**: Modern blockchain connectivity with React hooks for all authentication and Web3 operations.
- **Base Camp Testnet**: Configured for Camp Network's Base Camp testnet (chain ID: 123420001114) using CAMP as native gas currency.
- **Smart Contracts**: Includes an NFT contract for characters and a Companion NFT contract for AI companions (one per user).
- **Wallet Connection**: Supports email (via in-app wallet) and external wallets (MetaMask, Coinbase, Rainbow, Rabby, Zerion) through Thirdweb.
- **Multiple Character System**: Each NFT represents a unique character; users can mint multiple.
- **Character Collection System**: Dedicated "Mint More Characters" page with progress tracking and prevention of duplicate minting.

# External Dependencies

## Frontend Libraries
- **@react-three/fiber**: React renderer for Three.js.
- **@react-three/drei**: Helpers and abstractions for React Three Fiber.
- **@react-three/postprocessing**: Post-processing effects.
- **@tanstack/react-query**: Server state management and caching.

## Web3 & Blockchain
- **@thirdweb-dev/react**: Web3 React hooks and components.
- **Polygon Network**: Layer 2 blockchain (mentioned in original, but Base Camp testnet is primary network).
- **MetaMask/WalletConnect**: Wallet connection protocols.

## Database & ORM
- **@neondatabase/serverless**: Serverless PostgreSQL database.
- **drizzle-orm**: Type-safe ORM with PostgreSQL support.
- **drizzle-kit**: Migration and schema management tools.

## UI Components
- **@radix-ui/***: Accessible React components.
- **tailwindcss**: Utility-first CSS framework.
- **class-variance-authority**: Type-safe component variants.
- **lucide-react**: Icon library.

## Development Tools
- **vite**: Fast build tool and development server.
- **typescript**: Static type checking.
- **tsx**: TypeScript execution environment.
- **esbuild**: Fast JavaScript bundler.