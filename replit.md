# Overview

Temple Runner is an NFT-powered infinite runner game built with React, Three.js, and Privy wallet integration. Players run through a 3D environment collecting coins, avoiding obstacles, and can mint NFT characters that affect gameplay. The application combines gaming mechanics with blockchain functionality, allowing players to earn rewards and unlock content through NFT ownership.

## Recent Changes (2025-01-07)
- **Authentication Simplification**: Removed JWT/complex auth layers - now uses only Thirdweb wallet connection
- **Base Camp Testnet Integration**: Fully configured for Camp Network's Base Camp testnet (chain ID: 123420001114)
- **NFT Contract**: Set up with contract address 0x00005A2F0e8F4303F719A9f45F25cA578F4AA500
- **Deferred Reward System**: Mystery box tokens save recipient addresses for later claiming instead of immediate distribution
  - Standard reward: $0.001 worth of PUPPETS tokens
  - Jackpot reward: $10 PUPPETS (1 in 5000 chance)
- **Environment Configuration**: Organized all environment variables for easy Base Camp deployment
- **X (Twitter) Integration**: Automatic draft post sharing functionality tagging @PuppetsAI
- **Simplified Wallet Flow**: Direct wallet connection without additional authentication layers
- **3-Lane System**: Maintained classic Temple Run 3-lane discrete movement system
- **Performance Optimization**: Mobile-optimized 3D rendering with LOD management

# User Preferences

- Preferred communication style: Simple, everyday language
- Authentication: Email and wallet-based auth only (no social login options like Google, Apple, Facebook, phone)  
- Reward system: Save token recipients for later claiming rather than immediate distribution
- Network: Base Camp testnet by Camp Network for all blockchain operations

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Main UI framework using functional components and hooks
- **Three.js with React Three Fiber**: 3D graphics engine optimized for mobile performance
- **Zustand**: State management for game state, player progress, audio controls, authentication, and NFT ownership
- **Tailwind CSS with Radix UI**: Styling system with pre-built accessible components
- **Vite**: Build tool and development server with hot module replacement
- **Mobile Optimization**: Reduced shadow quality, lower polygon models, simplified lighting for mobile devices

## Game Engine Structure
- **Component-based 3D Scene**: Modular game objects with DaytimeSkybox, LOD Manager, ShadowCharacter
- **Game Loop**: Frame-based updates using React Three Fiber's useFrame hook
- **Physics System**: Custom collision detection and player movement mechanics
- **Character System**: Automatic replacement from shadow to NFT character after minting
- **Performance Optimization**: LOD scaling, lazy loading, and Canvas optimizations for mobile/desktop
- **Audio Management**: Sound effects and background music with mute controls
- **Progressive Difficulty**: Game speed increases over time for added challenge

## Backend Architecture
- **Express.js**: RESTful API server with JWT authentication and comprehensive error handling
- **PostgreSQL with Drizzle ORM**: Type-safe database operations with proper schema management
- **JWT Authentication**: Wallet-based authentication system for secure user sessions
- **Comprehensive API**: Game scores, leaderboards, token claims, NFT ownership tracking
- **Real Token Rewards**: Mystery box system with $0.01-$10+ crypto rewards based on performance

## Database Schema
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **User Management**: Basic user table with username/password authentication
- **Migration System**: Database schema versioning in ./migrations directory

## Web3 Integration
- **Thirdweb v5 SDK**: Modern blockchain connectivity with React hooks
- **Base Camp Testnet**: Camp Network testnet (chain ID: 123420001114) for low-cost testing
- **Smart Contract**: NFT contract at 0x00005A2F0e8F4303F719A9f45F25cA578F4AA500
- **Mystery Box System**: One-time claimable rewards with Puppets AI tokens
- **Wallet Authentication**: MetaMask and compatible wallets via Thirdweb Connect
- **Social Integration**: X (Twitter) sharing with automatic draft posts

## Game State Management
- **Phase Management**: Game states (start, playing, gameOver, mint, mysteryBox)
- **Player Progress**: Position tracking, movement controls, and collision detection
- **Reward System**: Coin collection, mystery box mechanics, and token rewards
- **NFT Integration**: Character unlocks and gameplay modifications based on ownership

# External Dependencies

## Frontend Libraries
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers and abstractions for React Three Fiber
- **@react-three/postprocessing**: Post-processing effects for enhanced visuals
- **@tanstack/react-query**: Server state management and caching

## Web3 & Blockchain
- **@thirdweb-dev/react**: Web3 React hooks and components
- **Polygon Network**: Layer 2 blockchain for low-cost transactions
- **MetaMask/WalletConnect**: Wallet connection protocols

## Database & ORM
- **@neondatabase/serverless**: Serverless PostgreSQL database
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **drizzle-kit**: Migration and schema management tools

## UI Components
- **@radix-ui/***: Comprehensive set of accessible React components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **lucide-react**: Icon library

## Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution environment
- **esbuild**: Fast JavaScript bundler for production builds