import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import { db } from "./storage";
import { users, gameScores, tokenClaims, nftOwnership, contracts } from '../shared/schema';
import { storeContract, getContract, updateContractAddress, getAllContracts } from "./contractService";
import { eq, desc, sum, count, and } from 'drizzle-orm';


const JWT_SECRET = process.env.JWT_SECRET || 'temple-runner-secret-key';

// Middleware to verify wallet-based authentication
const authenticateToken = async (req: any, res: any, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Handle wallet-based authentication (wallet_ADDRESS format)
  if (token.startsWith('wallet_')) {
    const walletAddress = token.replace('wallet_', '');
    if (!walletAddress || walletAddress.length < 10) {
      return res.status(403).json({ error: 'Invalid wallet address' });
    }
    
    // Find or create user for this wallet
    try {
      let user = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
      if (user.length === 0) {
        const newUser = await db.insert(users).values({
          walletAddress,
          username: `Player_${walletAddress.slice(-6)}`
        }).returning();
        user = newUser;
      }
      req.currentUser = { userId: user[0].id, walletAddress: user[0].walletAddress };
      next();
      return;
    } catch (error) {
      console.error('Wallet auth error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Handle JWT authentication (fallback)
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

  // Contract Management Routes
  app.post('/api/contracts', async (req, res) => {
    try {
      const { name, contractAddress, privateKey, publicKey, chainId } = req.body;
      
      const contract = await storeContract({
        name,
        contractAddress,
        privateKey,
        publicKey,
        chainId: chainId || 137
      });
      
      res.json({ success: true, contract });
    } catch (error) {
      console.error('Store contract error:', error);
      res.status(500).json({ error: 'Failed to store contract' });
    }
  });
  
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
  
  app.get('/api/contracts', async (req, res) => {
    try {
      const contracts = await getAllContracts();
      res.json(contracts);
    } catch (error) {
      console.error('Get contracts error:', error);
      res.status(500).json({ error: 'Failed to fetch contracts' });
    }
  });

  // User profile routes (wallet address based)
  app.get('/api/user/:address/stats', async (req, res) => {
    try {
      const walletAddress = req.params.address;
      
      const user = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
      if (user.length === 0) {
        return res.json({
          totalEarnings: 0,
          mysteryBoxesClaimed: 0,
          nftsMinted: 0,
          gamesPlayed: 0,
          highestScore: 0,
          totalDistance: 0,
          totalCoins: 0
        });
      }

      const userId = user[0].id;
      
      // Get aggregated game stats
      const gameStatsResult = await db.select({
        totalGames: count(gameScores.id),
        highestScore: desc(gameScores.score),
        totalDistance: sum(gameScores.distance),
        totalCoins: sum(gameScores.coinsCollected)
      }).from(gameScores).where(eq(gameScores.userId, userId));

      const gameStats = gameStatsResult[0] || {
        totalGames: 0,
        highestScore: 0,
        totalDistance: 0,
        totalCoins: 0
      };

      // Get highest score separately
      const highestScoreResult = await db
        .select({ score: gameScores.score })
        .from(gameScores)
        .where(eq(gameScores.userId, userId))
        .orderBy(desc(gameScores.score))
        .limit(1);

      const totalEarnings = parseFloat(user[0].totalTokensEarned || '0');
      const nftCount = await db.select({ count: count() }).from(nftOwnership).where(eq(nftOwnership.userId, userId));

      res.json({
        totalEarnings,
        mysteryBoxesClaimed: user[0].mysteryBoxesOpened || 0,
        nftsMinted: nftCount[0]?.count || 0,
        gamesPlayed: gameStats.totalGames || 0,
        highestScore: highestScoreResult[0]?.score || 0,
        totalDistance: gameStats.totalDistance || 0,
        totalCoins: gameStats.totalCoins || 0
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Failed to fetch user stats' });
    }
  });

  app.get('/api/user/:address/claims', async (req, res) => {
    try {
      const walletAddress = req.params.address;
      
      const user = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
      if (user.length === 0) {
        return res.json([]);
      }

      const claims = await db.select({
        id: tokenClaims.id,
        amount: tokenClaims.amount,
        tokenType: tokenClaims.reason,
        rarity: tokenClaims.reason, // Use reason as rarity indicator
        claimed: tokenClaims.claimed,
        createdAt: tokenClaims.createdAt
      }).from(tokenClaims)
        .where(eq(tokenClaims.userId, user[0].id))
        .orderBy(desc(tokenClaims.createdAt));

      const formattedClaims = claims.map(claim => ({
        ...claim,
        tokenType: 'PUPPETS',
        rarity: parseFloat(claim.amount) >= 10 ? 'legendary' : 
                parseFloat(claim.amount) >= 1 ? 'epic' : 
                parseFloat(claim.amount) >= 0.1 ? 'rare' : 
                parseFloat(claim.amount) >= 0.05 ? 'uncommon' : 'common'
      }));

      res.json(formattedClaims);
    } catch (error) {
      console.error('Get user claims error:', error);
      res.status(500).json({ error: 'Failed to fetch user claims' });
    }
  });

  app.get('/api/user/:address/nfts', async (req, res) => {
    try {
      const walletAddress = req.params.address;
      
      const user = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
      if (user.length === 0) {
        return res.json([]);
      }

      const nfts = await db.select({
        id: nftOwnership.id,
        tokenId: nftOwnership.tokenId,
        characterType: nftOwnership.characterType,
        mintedAt: nftOwnership.mintedAt
      }).from(nftOwnership)
        .where(eq(nftOwnership.userId, user[0].id))
        .orderBy(desc(nftOwnership.id));

      res.json(nfts);
    } catch (error) {
      console.error('Get user NFTs error:', error);
      res.status(500).json({ error: 'Failed to fetch user NFTs' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
