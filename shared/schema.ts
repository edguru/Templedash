import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username"),
  createdAt: timestamp("created_at").defaultNow(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  totalTokensEarned: decimal("total_tokens_earned", { precision: 10, scale: 4 }).default("0"),
  totalTokensClaimed: decimal("total_tokens_claimed", { precision: 10, scale: 4 }).default("0"),
  hasOpenedMysteryBox: boolean("has_opened_mystery_box").default(false),
  mysteryBoxesOpened: integer("mystery_boxes_opened").default(0),
  canOpenSecondBox: boolean("can_open_second_box").default(false),
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

export const companions = pgTable("companions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(), // One companion per user
  tokenId: text("token_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  role: text("role").notNull(), // partner, friend, pet
  gender: text("gender").notNull(), // male, female, non-binary
  flirtiness: integer("flirtiness").notNull(), // 0-100
  intelligence: integer("intelligence").notNull(), // 0-100
  humor: integer("humor").notNull(), // 0-100
  loyalty: integer("loyalty").notNull(), // 0-100
  empathy: integer("empathy").notNull(), // 0-100
  personalityType: text("personality_type").notNull(), // helpful, casual, professional
  appearance: text("appearance"), // description or IPFS hash
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  transactionHash: text("transaction_hash"),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  contractAddress: text("contract_address").notNull(),
  privateKey: text("private_key"),
  publicKey: text("public_key"),
  chainId: integer("chain_id").notNull().default(137),
  deployedAt: timestamp("deployed_at").defaultNow(),
  isActive: boolean("is_active").default(true),
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

export const insertCompanionSchema = createInsertSchema(companions).pick({
  userId: true,
  tokenId: true,
  contractAddress: true,
  name: true,
  age: true,
  role: true,
  gender: true,
  flirtiness: true,
  intelligence: true,
  humor: true,
  loyalty: true,
  empathy: true,
  personalityType: true,
  appearance: true,
  transactionHash: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GameScore = typeof gameScores.$inferSelect;
export type TokenClaim = typeof tokenClaims.$inferSelect;
export type NftOwnership = typeof nftOwnership.$inferSelect;
export type Companion = typeof companions.$inferSelect;
export type InsertCompanion = z.infer<typeof insertCompanionSchema>;
