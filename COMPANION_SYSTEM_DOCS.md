# Companion System Documentation

## Overview
The companion system enforces a one-companion-per-user model where users can create and mint a single AI companion as a regular NFT (not soulbound). This companion serves as their personalized AI assistant with customizable personality traits.

## Key Changes Made

### 1. Contract Update: From Soulbound to Regular NFT
- **File**: `contracts/CompanionNFT.sol` (renamed from `CompanionSoulboundToken.sol`)
- **Changes**: 
  - Removed soulbound restrictions
  - Added transfer functionality with ownership mapping updates
  - Changed contract name from "Companion Soulbound Token" to "Companion NFT"
  - Changed symbol from "CST" to "COMP"

### 2. Database Schema Enhancement
- **File**: `shared/schema.ts`
- **Added**: `companions` table with one-to-one user relationship
- **Unique constraint**: `userId` field ensures only one companion per user
- **Fields**: All personality traits (flirtiness, intelligence, humor, loyalty, empathy, etc.)

### 3. API Endpoints
- **File**: `server/routes.ts`
- **New endpoints**:
  - `GET /api/user/:walletAddress/companion` - Check if user has companion
  - `POST /api/user/:walletAddress/companion` - Create companion (with uniqueness check)
  - `PUT /api/user/:walletAddress/companion` - Update companion traits

### 4. One-Per-User Enforcement
- Database unique constraint on `companions.userId`
- API validation preventing duplicate companion creation
- Returns HTTP 409 (Conflict) if user attempts to create second companion

## User Flow

1. **User Registration**: Complete onboarding via wallet connection
2. **Companion Creation**: Design companion with personality traits
3. **NFT Minting**: Mint companion as transferable NFT on Base Camp testnet
4. **Database Storage**: Store companion metadata with user relationship
5. **Chat System**: Interact with personalized AI based on companion traits

## Technical Implementation

### Contract Features
- Regular ERC-721 NFT (transferable)
- Personality trait metadata on-chain
- One companion per wallet enforcement
- Mint fee: 0.001 CAMP

### Database Relationships
```sql
users (1) ← → (1) companions
```

### API Security
- Wallet address validation
- Required field validation
- Duplicate prevention
- Proper error handling

## Testing Companion System

1. Check companion status for new user:
```bash
curl -X GET "http://localhost:5000/api/user/0x1234.../companion"
```

2. Create companion for user:
```bash
curl -X POST "http://localhost:5000/api/user/0x1234.../companion" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "1",
    "contractAddress": "0x...",
    "name": "Alex",
    "age": 25,
    "role": "partner",
    "gender": "male",
    "flirtiness": 70,
    "intelligence": 85,
    "humor": 90,
    "loyalty": 95,
    "empathy": 80,
    "personalityType": "helpful",
    "appearance": "Tall with dark hair",
    "transactionHash": "0x..."
  }'
```

3. Attempt to create second companion (should fail):
```bash
# Same request as above - will return HTTP 409
```

## Error Scenarios

- **User not found**: HTTP 404
- **Missing required fields**: HTTP 400
- **Duplicate companion**: HTTP 409 "User already has a companion"
- **Server error**: HTTP 500 with error details

## Integration Points

- **CompanionHandler Agent**: Uses companion traits for personalized responses
- **Thirdweb Contract**: NFT minting and ownership management
- **Chat System**: Personality-driven AI interactions
- **Frontend**: Companion creation UI and trait customization