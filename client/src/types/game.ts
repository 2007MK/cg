export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";
  value: number;
}

export interface Player {
  id: string;
  gameId: string;
  userId?: string;
  playerNumber: number;
  team: "A" | "B";
  hand: Card[];
  bid: number;
  tricks: number;
  isConnected: boolean;
  name?: string;
  username?: string;
}

export type GameVariant = "single_sar" | "double_sar" | "hidden_trump";

export interface Game {
  id: string;
  status: "waiting" | "bidding" | "playing" | "completed";
  phase: "bidding" | "playing";
  variant: GameVariant;
  currentRound: number;
  currentPlayer: number;
  trumpSuit?: "hearts" | "diamonds" | "clubs" | "spades";
  trumpRevealed: boolean;
  trumpCard?: Card;
  highestBid?: number;
  biddingPlayer?: number;
  gameState: any;
  createdAt?: Date;
}

export interface GameMessage {
  type: "join" | "bid" | "pass" | "play_card" | "reveal_trump" | "game_update" | "error";
  data: any;
  playerId?: string;
  gameId?: string;
}

export interface TrickCard {
  playerId: string;
  playerNumber: number;
  card: Card;
}
