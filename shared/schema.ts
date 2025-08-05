import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username"),
  createdAt: timestamp("created_at").defaultNow(),
  totalTokensEarned: decimal("total_tokens_earned", { precision: 10, scale: 4 }).default("0"),
  totalTokensClaimed: decimal("total_tokens_claimed", { precision: 10, scale: 4 }).default("0"),
});

export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  score: integer("score").notNull(),
  distance: integer("distance").notNull(),
  coinsCollected: integer("coins_collected").notNull(),
  characterUsed: text("character_used").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const tokenClaims = pgTable("token_claims", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 4 }).notNull(),
  reason: text("reason").notNull(), // 'game_reward', 'mystery_box', 'bonus'
  transactionHash: text("transaction_hash"),
  claimed: boolean("claimed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  claimedAt: timestamp("claimed_at"),
});

export const nftOwnership = pgTable("nft_ownership", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tokenId: text("token_id").notNull(),
  characterType: text("character_type").notNull(), // 'blue', 'red', 'green'
  mintedAt: timestamp("minted_at").defaultNow(),
  transactionHash: text("transaction_hash").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  walletAddress: true,
  username: true,
});

export const insertGameScoreSchema = createInsertSchema(gameScores).pick({
  userId: true,
  score: true,
  distance: true,
  coinsCollected: true,
  characterUsed: true,
});

export const insertTokenClaimSchema = createInsertSchema(tokenClaims).pick({
  userId: true,
  amount: true,
  reason: true,
});

export const insertNftOwnershipSchema = createInsertSchema(nftOwnership).pick({
  userId: true,
  tokenId: true,
  characterType: true,
  transactionHash: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GameScore = typeof gameScores.$inferSelect;
export type TokenClaim = typeof tokenClaims.$inferSelect;
export type NftOwnership = typeof nftOwnership.$inferSelect;
