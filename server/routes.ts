import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import { db } from "./storage";
import { users, gameScores, tokenClaims, nftOwnership } from '../shared/schema';
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

  // Mystery box reward
  app.post('/api/game/mystery-box', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.currentUser.userId;
      
      // Random reward between $0.01 and $10
      const rewards = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0];
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];

      // Add mystery box reward
      const claim = await db.insert(tokenClaims).values({
        userId,
        amount: randomReward.toString(),
        reason: 'mystery_box'
      }).returning();

      res.json({
        reward: randomReward,
        claim: claim[0]
      });
    } catch (error) {
      console.error('Mystery box error:', error);
      res.status(500).json({ error: 'Failed to process mystery box' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
