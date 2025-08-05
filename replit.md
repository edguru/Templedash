# Overview

Temple Runner is an NFT-powered infinite runner game built with React, Three.js, and Privy wallet integration. Players run through a 3D environment collecting coins, avoiding obstacles, and can mint NFT characters that affect gameplay. The application combines gaming mechanics with blockchain functionality, allowing players to earn rewards and unlock content through NFT ownership.

## Recent Changes (2025-01-15)
- **3-Lane System**: Implemented classic Temple Run 3-lane discrete movement system
- **Terrain Cleanup**: Removed problematic forest terrain, created clean running path with stone walls
- **Character Orientation**: Fixed character rotation to face forward with back toward camera
- **Lane Switching**: Buttons now switch between discrete lanes (-2, 0, 2) instead of continuous movement
- **Collision Detection**: Enhanced obstacle collision with jumping mechanics - rocks can be jumped over, trees cannot
- **Touch Controls**: Direct integration with player movement functions for responsive controls
- **Visual Improvements**: Simplified terrain layout with clear boundaries and better performance
- **Physics Enhancement**: Improved jumping mechanics and gravity system for realistic movement
- **Performance Optimization**: Reduced terrain complexity, enhanced lighting, and Canvas settings
- **Game Flow**: Fixed collision detection to properly trigger game over state
- **UI Cleanup**: Removed duplicate touch controls by eliminating SimpleTouchControls component

# User Preferences

Preferred communication style: Simple, everyday language.

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
- **Thirdweb SDK**: Blockchain connectivity and NFT contract interactions
- **Polygon Network**: Low-cost transactions for NFT minting and gameplay
- **Wallet Connection**: Web3 wallet integration for user authentication
- **Smart Contract Interaction**: NFT minting and ownership verification

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