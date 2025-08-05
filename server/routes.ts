import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import { db } from "./storage";
import { users, gameScores, tokenClaims, nftOwnership, contracts, wallets } from '../shared/schema';
import { storeContract, getContract, updateContractAddress, getAllContracts } from "./contractService";
import { generateWallet, deployERC721Contract, mintNFT } from "./walletService";
import { eq, desc, sum, count, and } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'temple-runner-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.currentUser = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Login/Register with wallet address
  app.post('/api/auth/wallet', async (req, res) => {
    try {
      const { walletAddress, username } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required' });
      }

      // Check if user exists
      let user = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
      
      if (user.length === 0) {
        // Create new user
        const newUser = await db.insert(users).values({
          walletAddress,
          username: username || `Player_${walletAddress.slice(-6)}`
        }).returning();
        user = newUser;
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user[0].id, walletAddress: user[0].walletAddress },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: user[0]
      });
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Get user profile
  app.get('/api/user/profile', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.currentUser.userId;
      
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's NFTs
      const userNFTs = await db.select().from(nftOwnership).where(eq(nftOwnership.userId, userId));
      
      // Get user's game stats
      const gameStats = await db.select({
        totalGames: count(),
        bestScore: sum(gameScores.score),
        totalCoins: sum(gameScores.coinsCollected)
      }).from(gameScores).where(eq(gameScores.userId, userId));

      res.json({
        ...user[0],
        nfts: userNFTs,
        stats: gameStats[0]
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Submit game score
  app.post('/api/game/score', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.currentUser.userId;
      const { score, distance, coinsCollected, characterUsed } = req.body;

      // Save game score
      const gameScore = await db.insert(gameScores).values({
        userId,
        score: parseInt(score),
        distance: parseInt(distance),
        coinsCollected: parseInt(coinsCollected),
        characterUsed
      }).returning();

      // Calculate token reward based on performance
      let tokenReward = Math.floor(score / 100) * 0.001; // Base reward
      if (score > 1000) tokenReward *= 1.5; // Bonus for high scores
      if (coinsCollected > 50) tokenReward += 0.01; // Coin collection bonus

      // Add token claim
      if (tokenReward > 0) {
        await db.insert(tokenClaims).values({
          userId,
          amount: tokenReward.toString(),
          reason: 'game_reward'
        });
      }

      res.json({ 
        gameScore: gameScore[0],
        tokenReward 
      });
    } catch (error) {
      console.error('Score submission error:', error);
      res.status(500).json({ error: 'Failed to submit score' });
    }
  });

  // Get leaderboard
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const leaderboard = await db
        .select({
          userId: users.id,
          username: users.username,
          walletAddress: users.walletAddress,
          bestScore: sum(gameScores.score),
          totalGames: count(gameScores.id),
          totalCoins: sum(gameScores.coinsCollected)
        })
        .from(gameScores)
        .innerJoin(users, eq(gameScores.userId, users.id))
        .groupBy(users.id, users.username, users.walletAddress)
        .orderBy(desc(sum(gameScores.score)))
        .limit(50);

      res.json(leaderboard);
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // Get user's token claims
  app.get('/api/user/tokens', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.currentUser.userId;
      
      const claims = await db.select().from(tokenClaims)
        .where(eq(tokenClaims.userId, userId))
        .orderBy(desc(tokenClaims.createdAt));

      const totalUnclaimed = await db.select({
        total: sum(tokenClaims.amount)
      }).from(tokenClaims)
        .where(and(eq(tokenClaims.userId, userId), eq(tokenClaims.claimed, false)));

      res.json({
        claims,
        totalUnclaimed: totalUnclaimed[0]?.total || '0'
      });
    } catch (error) {
      console.error('Token claims error:', error);
      res.status(500).json({ error: 'Failed to fetch token claims' });
    }
  });

  // Mint NFT character
  app.post('/api/nft/mint', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.currentUser.userId;
      const { tokenId, characterType, transactionHash } = req.body;

      // Record NFT ownership
      const nft = await db.insert(nftOwnership).values({
        userId,
        tokenId,
        characterType,
        transactionHash
      }).returning();

      res.json(nft[0]);
    } catch (error) {
      console.error('NFT mint error:', error);
      res.status(500).json({ error: 'Failed to record NFT mint' });
    }
  });

  // Mystery box reward with precise distribution
  app.post('/api/game/mystery-box', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.currentUser.userId;
      const { walletAddress } = req.body;

      // Check if user has already opened mystery box
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length && user[0].hasOpenedMysteryBox) {
        return res.status(400).json({ error: 'Mystery box already opened' });
      }

      // Exact distribution for $500 among 10,000 players
      const MYSTERY_BOX_REWARDS = [
        { amount: 10, chance: 0.001 },     // 0.1% → $10 (10 players)  
        { amount: 1, chance: 0.01 },       // 1% → $1 (100 players)
        { amount: 0.1, chance: 0.04 },     // 4% → $0.10 (400 players)
        { amount: 0.05, chance: 0.10 },    // 10% → $0.05 (1000 players)
        { amount: 0.01, chance: 0.25 },    // 25% → $0.01 (2500 players)
        { amount: 0.005, chance: 0.30 },   // 30% → $0.005 (3000 players)
        { amount: 0.001, chance: 0.299 },  // 29.9% → $0.001 (2990 players)
      ];

      // Generate weighted random reward
      let random = Math.random();
      let cumulative = 0;
      let selectedReward = { amount: 0.001, rarity: 'common' };
      
      for (const reward of MYSTERY_BOX_REWARDS) {
        cumulative += reward.chance;
        if (random < cumulative) {
          let rarity = 'common';
          if (reward.amount >= 10) rarity = 'legendary';
          else if (reward.amount >= 1) rarity = 'epic';
          else if (reward.amount >= 0.1) rarity = 'rare';
          else if (reward.amount >= 0.05) rarity = 'uncommon';
          
          selectedReward = { amount: reward.amount, rarity };
          break;
        }
      }

      // Update mystery box count and check limits
      const currentBoxes = user[0]?.mysteryBoxesOpened || 0;
      const canOpenSecond = (parseInt(user[0].id.toString()) % 10) === 0; // 10% of users
      
      if (currentBoxes >= (canOpenSecond ? 2 : 1)) {
        return res.status(400).json({ error: 'Mystery box limit reached' });
      }

      // Mark user as having opened mystery box
      await db
        .update(users)
        .set({ 
          hasOpenedMysteryBox: true,
          mysteryBoxesOpened: currentBoxes + 1,
          canOpenSecondBox: canOpenSecond,
          totalTokensEarned: String(Number(user[0]?.totalTokensEarned || 0) + selectedReward.amount)
        })
        .where(eq(users.id, userId));

      // Add mystery box reward
      const claim = await db.insert(tokenClaims).values({
        userId,
        amount: selectedReward.amount.toString(),
        reason: 'mystery_box'
      }).returning();

      res.json({
        reward: selectedReward.amount,
        rarity: selectedReward.rarity,
        claim: claim[0],
        message: `Congratulations! You won $${selectedReward.amount} tokens!`
      });
    } catch (error) {
      console.error('Mystery box error:', error);
      res.status(500).json({ error: 'Failed to process mystery box' });
    }
  });

  // Claim mystery box reward (separate endpoint for claiming tokens)
  app.post('/api/tokens/claim', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.currentUser.userId;
      const { amount, reason } = req.body;
      
      // Validate amount
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: 'Invalid reward amount' });
      }

      // Add token claim
      const claim = await db.insert(tokenClaims).values({
        userId,
        amount: parseFloat(amount).toString(),
        reason: reason || 'mystery_box'
      }).returning();

      res.json({
        success: true,
        claim: claim[0],
        message: `Successfully claimed $${amount} tokens!`
      });
    } catch (error) {
      console.error('Token claim error:', error);
      res.status(500).json({ error: 'Failed to claim reward' });
    }
  });

  // Get user's mystery box status (limit: 1 per user, <10% get second box)
  app.get('/api/user/mystery-box-status', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.currentUser.userId;
      
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (user.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userRecord = user[0];
      
      // Check if user gets second box (10% chance assigned randomly based on user ID)
      const canOpenSecond = (parseInt(userRecord.id.toString()) % 10) === 0; // 10% of users

      res.json({
        opened: userRecord.mysteryBoxesOpened || 0,
        canOpenSecond: userRecord.canOpenSecondBox || canOpenSecond,
        maxBoxes: canOpenSecond ? 2 : 1
      });
    } catch (error) {
      console.error('Mystery box status error:', error);
      res.status(500).json({ error: 'Failed to fetch mystery box status' });
    }
  });

  // Wallet Management Routes
  app.post('/api/wallets/generate', async (req, res) => {
    try {
      const { name } = req.body;
      const walletData = await generateWallet(name || 'Game Wallet');
      
      res.json({
        success: true,
        wallet: {
          address: walletData.address,
          // Don't return private keys in API response for security
          publicKey: walletData.publicKey
        }
      });
    } catch (error) {
      console.error('Wallet generation error:', error);
      res.status(500).json({ error: 'Failed to generate wallet' });
    }
  });

  app.get('/api/wallets', async (req, res) => {
    try {
      const allWallets = await db.select({
        id: wallets.id,
        name: wallets.name,
        address: wallets.address,
        publicKey: wallets.publicKey,
        createdAt: wallets.createdAt,
        isActive: wallets.isActive
      }).from(wallets);
      
      res.json(allWallets);
    } catch (error) {
      console.error('Wallet fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch wallets' });
    }
  });

  // Contract Management Routes
  app.post('/api/contracts/deploy', async (req, res) => {
    try {
      const { walletId, networkName, contractName, contractSymbol } = req.body;
      
      if (!walletId) {
        return res.status(400).json({ error: 'Wallet ID is required' });
      }

      const deployment = await deployERC721Contract(
        walletId,
        networkName || 'sepolia',
        contractName || 'Temple Runner NFT',
        contractSymbol || 'TRN'
      );

      res.json({
        success: true,
        deployment
      });
    } catch (error) {
      console.error('Contract deployment error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to deploy contract'
      });
    }
  });

  app.get('/api/contracts', async (req, res) => {
    try {
      const allContracts = await db.select().from(contracts);
      res.json(allContracts);
    } catch (error) {
      console.error('Contract fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch contracts' });
    }
  });

  app.post('/api/contracts/:id/mint', async (req, res) => {
    try {
      const { id } = req.params;
      const { toAddress, tokenId } = req.body;
      
      if (!toAddress || !tokenId) {
        return res.status(400).json({ error: 'toAddress and tokenId are required' });
      }

      const result = await mintNFT(parseInt(id), toAddress, tokenId);
      
      res.json({
        success: true,
        mint: result
      });
    } catch (error) {
      console.error('NFT minting error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to mint NFT'
      });
    }
  });

  // Legacy routes for backward compatibility
  app.get('/api/contracts/:name', async (req, res) => {
    try {
      const contract = await getContract(req.params.name);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      res.json(contract);
    } catch (error) {
      console.error('Get contract error:', error);
      res.status(500).json({ error: 'Failed to fetch contract' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
