# Overview

Puppet Runner is an NFT-powered infinite runner game built by Puppets AI with React, Three.js, and Thirdweb wallet integration. Players run through a 3D environment collecting coins, avoiding obstacles, and can mint NFT characters that affect gameplay. The application combines gaming mechanics with blockchain functionality, allowing players to earn rewards and unlock content through NFT ownership.

## Recent Changes (2025-08-17 - AUTHENTICATION FIX + SESSION KEY AUTOMATION)
- **Authentication System Fixed**: Resolved all 401 authorization errors for companion chat system
  - **Removed JWT Requirements**: Agent endpoints now work without token-based authentication
  - **Wallet-Based Auth**: Simplified authentication using wallet addresses directly
  - **UUID Import Fixed**: Resolved ES module compatibility issues causing 500 errors
  - **TypeScript Errors Resolved**: Fixed type definition conflicts in server routes
- **Automatic Session Key Creation**: Enhanced user onboarding with seamless session management
  - **Existing User Detection**: System automatically detects existing users on wallet connection
  - **Session Key Generation**: Creates missing session keys automatically for returning users
  - **KMS Integration**: Secure storage of session keys using AWS KMS encryption
  - **Onboarding Bypass**: Smart flow that skips onboarding for users who already completed it
- **Companion Chat System Operational**: Multi-agent CrewAI system now fully functional
  - **14-Agent Architecture**: All agents initialized and ready for task execution
  - **Chain of Thought Injection**: Dynamic reasoning capabilities active
  - **Goat MCP Integration**: Base Camp network blockchain operations ready
  - **Task Management**: Creation and tracking of blockchain automation tasks
- **Previous Features Maintained**:
  - **AWS KMS Secret Management**: Enterprise-grade secure storage system with production credentials
  - **OpenAI GPT-4o Integration**: Advanced reasoning when API key provided, graceful fallback without key
  - **Base Camp Network**: Configured for Chain ID 123420001114 with CAMP token support
  - **Thirdweb Integration**: Seamless wallet connection with automatic session creation

## Previous Changes (2025-08-17 - APP REDESIGN)
- **Major Architecture Pivot**: Repositioned from game-first to companion-first application
  - **Primary Focus**: Chat companion and Web3 task automation as main features
  - **Secondary Focus**: Puppet Runner moved to mini-games section as entertainment feature
  - **Current Display**: Application shows Companion Chat system by design (not the 3D game)
- **New MainApp Component**: Complete app redesign with dedicated tabs for Chat, Tasks, Mini Games, and Account
- **TasksScreen**: Full Web3 task management system with automation workflows, priority levels, and category organization
- **MiniGamesScreen**: Gaming hub featuring Puppet Runner with stats, ratings, and rewards tracking
- **AccountScreen**: Comprehensive wallet management, game statistics, achievements, and settings
- **Streamlined Login**: Simplified wallet connection page inspired by wireframe, minimal text and clean design
- **Navigation Structure**: Mobile-first responsive design with bottom navigation and desktop sidebar
- **App Flow**: Wallet connection → Main companion interface (default: Chat tab) → Mini games accessible via tab

## Previous Changes (2025-08-13 - CHECKPOINT)
- **Authentication Simplification**: Removed JWT/complex auth layers - now uses only Thirdweb wallet connection
- **Base Camp Testnet Integration**: Fully configured for Camp Network's Base Camp testnet (chain ID: 123420001114)
  - **Currency**: Uses CAMP as native gas currency
  - **NFT Minting**: Requires 0.001 CAMP for mint fee
  - **Block Explorer**: https://basecamp.cloud.blockscout.com
- **NFT Contract**: Confirmed deployed at 0x00005A2F0e8F4303F719A9f45F25cA578F4AA500 (proxy contract with TokenERC721 implementation)
- **Multiple Character System**: Complete character selection and ownership system
  - Each NFT represents one unique character (Ninja Warrior, Space Ranger, Crystal Mage)
  - Users can mint multiple NFTs to own multiple characters
  - Character selector screen for players with multiple owned characters
  - Smart game flow: no characters → mint, one character → start directly, multiple → show selector
  - Fixed keyboard controls for all character types with proper NFT character rendering
- **Character Collection System**: Added dedicated "Mint More Characters" page
  - Users can mint up to 3 total characters (one of each type)
  - Progress tracking showing collection completion (X/3 characters)
  - Prevention of duplicate character minting
  - Collection completion celebration screen
- **Database Fix**: Resolved SQL GROUP BY error in user stats endpoint
- **Deferred Reward System**: Mystery box tokens save recipient addresses for later claiming instead of immediate distribution
  - Standard reward: $0.001 worth of PUPPETS tokens
  - Jackpot reward: $10 PUPPETS (1 in 5000 chance)
  - Added airdrop notification in mystery box explaining deferred token distribution
- **Comprehensive Onboarding System**: Complete new user experience
  - Social media follow requirements (X and Telegram)
  - 8-step pixel-style interactive tutorial covering all game features
  - Smart flow detection for new vs returning users
  - Tutorial access button on main menu for returning players
- **Environment Configuration**: Organized all environment variables for easy Base Camp deployment
- **X (Twitter) Integration**: Automatic draft post sharing functionality tagging @PuppetsAI
- **Simplified Wallet Flow**: Direct wallet connection without additional authentication layers
- **3-Lane System**: Maintained classic Temple Run 3-lane discrete movement system
- **Performance Optimization**: Mobile-optimized 3D rendering with LOD management
- **High-Quality Character Assets**: All character assets regenerated using Tripo API for superior quality
  - Enhanced shadow_character.glb with athletic silhouette design (1.7MB)
  - Improved character_red.glb with detailed red athletic runner (1.8MB)
  - Enhanced character_blue.glb with detailed blue athletic runner (1.8MB)
  - Upgraded character_green.glb with detailed green athletic runner (1.8MB)
- **Graphics Quality Improvements**: Enhanced visual fidelity while maintaining mobile performance
  - Upgraded renderer precision from mediump to highp
  - Enhanced shadow mapping with PCF soft shadows
  - Adaptive shadow quality (1024px mobile, 2048px desktop)
  - Improved tone mapping with ACES Filmic for better HDR colors
  - Gamma correction and proper color space handling
  - Enhanced lighting with better material properties
  - Atmospheric fog effects (desktop only for performance)
  - Mobile-optimized visual effects system
- **Character Loading System**: Implemented advanced GLB character loading with Suspense
  - Fixed GLB texture loading issues with proper error handling
  - Enhanced fallback character with athletic silhouette and advanced materials
  - Proper shadow casting and receiving for all character models
  - Texture-less rendering to avoid mobile compatibility issues
- **Database Environment Variables**: Complete database configuration added to .env
  - DATABASE_URL with full PostgreSQL connection string
  - Individual PostgreSQL variables (PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT)
  - Updated .env.example with proper database configuration template

# User Preferences

- **AI System**: Single CrewAI-powered multi-agent system with chain of thought injection (not multiple competing systems)
- **Chain of Thought**: Use Manus AI-style dynamic reasoning injection into working memory during execution
- **App Focus**: Companion chat and task automation as primary features, Puppet Runner as mini-game
- **Design Style**: Clean, minimal interface inspired by wireframe - avoid excessive text
- **Communication**: Simple, everyday language
- **Authentication**: Email and wallet-based auth only via Thirdweb (no social login options)  
- **Reward system**: Save token recipients for later claiming rather than immediate distribution
- **Network**: Base Camp testnet by Camp Network for all blockchain operations

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
- **Character System**: Each NFT represents one unique character - users can mint multiple NFTs to own multiple characters
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
- **Thirdweb v5 SDK**: Modern blockchain connectivity with React hooks - all authentication goes through Thirdweb
- **Base Camp Testnet**: Camp Network testnet (chain ID: 123420001114) for low-cost testing
- **Smart Contract**: NFT contract at 0x00005A2F0e8F4303F719A9f45F25cA578F4AA500
- **Mystery Box System**: One-time claimable rewards with Puppets AI tokens
- **Authentication Methods**: Email (via inApp wallet) and external wallets (MetaMask, Coinbase, Rainbow, Rabby, Zerion) - all through Thirdweb
- **Social Integration**: X (Twitter) sharing with automatic draft posts

## Game State Management
- **Phase Management**: Game states (start, playing, gameOver, mint, mysteryBox)
- **Player Progress**: Position tracking, movement controls, and collision detection
- **Reward System**: Coin collection, mystery box mechanics, and token rewards
- **NFT Integration**: Each NFT = one character, users can mint multiple characters for variety and collection

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