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
  backgroundStory: text("background_story"), // optional personal backstory
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

// Chat conversations and history management
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  companionId: integer("companion_id").references(() => companions.id),
  sessionId: text("session_id").notNull(), // For grouping related messages
  chatTitle: text("chat_title"), // User-defined or auto-generated title
  userMessage: text("user_message").notNull(),
  companionResponse: text("companion_response"),
  messageType: text("message_type").default("chat"), // 'chat', 'task', 'system'
  sentiment: text("sentiment"), // 'positive', 'neutral', 'negative'
  taskExecuted: boolean("task_executed").default(false),
  executedByAgent: text("executed_by_agent"), // Which agent handled the task
  context: text("context"), // JSON string for additional context
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  companionId: integer("companion_id").references(() => companions.id),
  title: text("title").default("New Chat"),
  description: text("description"),
  messageCount: integer("message_count").default(0),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const insertConversationSchema = createInsertSchema(conversations).pick({
  userId: true,
  companionId: true,
  sessionId: true,
  chatTitle: true,
  userMessage: true,
  companionResponse: true,
  messageType: true,
  sentiment: true,
  taskExecuted: true,
  executedByAgent: true,
  context: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  sessionId: true,
  userId: true,
  companionId: true,
  title: true,
  description: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GameScore = typeof gameScores.$inferSelect;
export type TokenClaim = typeof tokenClaims.$inferSelect;
export type NftOwnership = typeof nftOwnership.$inferSelect;
export type Companion = typeof companions.$inferSelect;
export type InsertCompanion = z.infer<typeof insertCompanionSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

// Transaction monitoring table for Phase 4
export const transactionStatuses = pgTable("transaction_statuses", {
  id: text("id").primaryKey(), // UUID
  taskId: text("task_id").notNull(),
  transactionHash: text("transaction_hash"),
  status: text("status").notNull(), // 'pending', 'submitted', 'confirmed', 'failed'
  userWallet: text("user_wallet").notNull(),
  requestId: text("request_id"),
  sessionId: text("session_id"),
  executionMethod: text("execution_method").notNull(), // 'chat', 'execute'
  unsignedTxData: text("unsigned_tx_data"), // JSON string
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTransactionStatusSchema = createInsertSchema(transactionStatuses).pick({
  id: true,
  taskId: true,
  transactionHash: true,
  status: true,
  userWallet: true,
  requestId: true,
  sessionId: true,
  executionMethod: true,
  unsignedTxData: true,
  errorMessage: true,
});

export type TransactionStatus = typeof transactionStatuses.$inferSelect;
export type InsertTransactionStatus = z.infer<typeof insertTransactionStatusSchema>;

// Tasks table for persistent task management
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(), // UUID
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'user_request', 'scheduled', 'webhook'
  category: text("category").default("general"), // 'defi', 'nft', 'token', 'general'
  description: text("description").notNull(),
  parameters: text("parameters"), // JSON string
  status: text("status").notNull().default("pending"), // 'pending', 'running', 'completed', 'failed', 'cancelled'
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high'
  progress: integer("progress").default(0), // 0-100
  assignedAgent: text("assigned_agent"), // Agent ID
  result: text("result"), // JSON string
  error: text("error"),
  userWallet: text("user_wallet").notNull(),
  sessionId: text("session_id"),
  estimatedDuration: integer("estimated_duration"), // In seconds
  actualDuration: integer("actual_duration"), // In seconds
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  id: true,
  userId: true,
  type: true,
  category: true,
  description: true,
  parameters: true,
  status: true,
  priority: true,
  progress: true,
  assignedAgent: true,
  result: true,
  error: true,
  userWallet: true,
  sessionId: true,
  estimatedDuration: true,
  actualDuration: true,
  retryCount: true,
  maxRetries: true,
  metadata: true,
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
