# Overview

Puppet Runner is an NFT-powered infinite runner game that combines gaming mechanics with blockchain functionality. Players run through a 3D environment collecting coins and avoiding obstacles. The application's core focus has shifted to a personalized AI companion system, with the game itself becoming a mini-game feature. This project integrates NFT characters that affect gameplay, allowing players to earn rewards and unlock content through NFT ownership, all while interacting with an AI companion. The business vision is to blend interactive AI with Web3 gaming, offering unique, personalized experiences and leveraging blockchain for digital ownership and rewards.

## Recent Updates (January 17, 2025)
- **Working Token Balance Checking**: Successfully implemented end-to-end CAMP token balance checking with proper wallet address propagation through the entire agent system (CompanionHandler → TaskOrchestrator → GoatMCP)
- **Fixed Critical Message Routing Bug**: Resolved wallet address context flow ensuring user's wallet address is properly passed through all agent messaging layers
- **CompanionNFT Contract Deployed**: Successfully deployed CompanionNFT contract at address `0x742d35Cc6e2C3e312318508CF3c66E2E2B45A1b5` on Base Camp Testnet
- **Comprehensive System Prompts**: Implemented detailed, accurate system prompts for all 15 agents in the CrewAI architecture
- **Enhanced Agent Accuracy**: Each agent now has specialized prompts defining their role, capabilities, and operational guidelines
- **Improved Intent Recognition**: CompanionHandler, TaskAnalyzer, PromptEngineer, TaskOrchestrator, GoatMCP, and NebulaMCP now operate with enhanced precision
- **Technical Specialization**: Agents now have clear understanding of Base Camp testnet operations, CAMP token mechanics, and Web3 task routing
- **Personality-Driven Responses**: CompanionHandler now generates dynamic system prompts based on user-defined companion traits and relationship types

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
- **Advanced AI System**: 15-agent CrewAI architecture with comprehensive system prompts for enhanced accuracy and task execution.

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