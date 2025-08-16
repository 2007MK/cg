import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull().default("waiting"), // waiting, bidding, playing, completed
  phase: text("phase").notNull().default("bidding"), // bidding, trump_selection, playing
  variant: text("variant").notNull().default("single_sar"), // single_sar, double_sar, hidden_trump
  currentRound: integer("current_round").notNull().default(1),
  currentPlayer: integer("current_player").notNull().default(0),
  trumpSuit: text("trump_suit"), // hearts, diamonds, clubs, spades
  trumpRevealed: boolean("trump_revealed").notNull().default(false),
  trumpCard: jsonb("trump_card"), // {suit: string, rank: string}
  highestBid: integer("highest_bid").default(0),
  biddingPlayer: integer("bidding_player").default(0),
  gameState: jsonb("game_state").notNull().default('{}'), // full game state
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  userId: varchar("user_id").references(() => users.id),
  playerNumber: integer("player_number").notNull(), // 0, 1, 2, 3
  team: text("team").notNull(), // A, B
  hand: jsonb("hand").notNull().default('[]'), // array of cards
  bid: integer("bid").default(0),
  tricks: integer("tricks").notNull().default(0),
  isConnected: boolean("is_connected").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

// Game types for WebSocket communication
export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";
  value: number;
}

export interface GameMessage {
  type: "join" | "bid" | "pass" | "play_card" | "select_trump" | "reveal_trump" | "game_update" | "error";
  data: any;
  playerId?: string;
  gameId?: string;
}

export type GameVariant = "single_sar" | "double_sar" | "hidden_trump";

export const GAME_VARIANTS = {
  single_sar: {
    name: "Single Sar",
    description: "Basic Court Piece rules. Win tricks by playing the highest card.",
    rules: [
      "Player calls trump suit openly",
      "Highest card wins the trick",
      "First team to 7+ tricks wins"
    ]
  },
  double_sar: {
    name: "Double Sar", 
    description: "Win 2 consecutive tricks to collect cards from the table.",
    rules: [
      "Must win 2 consecutive tricks to collect cards",
      "Single tricks don't count until consecutive wins",
      "More strategic gameplay required"
    ]
  },
  hidden_trump: {
    name: "Hidden Trump",
    description: "Trump card remains face down until revealed strategically.",
    rules: [
      "Trump card is placed face down",
      "Revealed when player can't follow suit",
      "Adds mystery and strategy to gameplay"
    ]
  }
} as const;
