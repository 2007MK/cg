import { type User, type InsertUser, type Game, type InsertGame, type Player, type InsertPlayer, type Card } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Games
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined>;
  
  // Players
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayersByGame(gameId: string): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<string, Game>;
  private players: Map<string, Player>;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.players = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = randomUUID();
    const game: Game = {
      status: "waiting",
      phase: "bidding",
      variant: "single_sar",
      currentRound: 1,
      currentPlayer: 0,
      trumpSuit: null,
      trumpRevealed: false,
      trumpCard: null,
      highestBid: null,
      biddingPlayer: null,
      gameState: {},
      ...insertGame,
      id,
      createdAt: new Date(),
    };
    this.games.set(id, game);
    return game;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayersByGame(gameId: string): Promise<Player[]> {
    return Array.from(this.players.values()).filter(
      (player) => player.gameId === gameId
    );
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = { 
      userId: null,
      hand: [],
      bid: null,
      tricks: 0,
      isConnected: false,
      ...insertPlayer, 
      id 
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...updates };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }
}

export const storage = new MemStorage();

// Game utility functions
export function createDeck(): Card[] {
  const suits = ["hearts", "diamonds", "clubs", "spades"] as const;
  const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"] as const;
  const values = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  
  const deck: Card[] = [];
  suits.forEach(suit => {
    ranks.forEach((rank, index) => {
      deck.push({ suit, rank, value: values[index] });
    });
  });
  
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], playerCount: number = 4): Card[][] {
  const hands: Card[][] = [[], [], [], []];
  
  // Deal 5 cards first
  for (let i = 0; i < 5; i++) {
    for (let p = 0; p < playerCount; p++) {
      if (deck.length > 0) {
        hands[p].push(deck.pop()!);
      }
    }
  }
  
  return hands;
}

export function dealRemainingCards(deck: Card[], hands: Card[][], playerCount: number = 4): Card[][] {
  // Deal remaining 8 cards
  for (let i = 0; i < 8; i++) {
    for (let p = 0; p < playerCount; p++) {
      if (deck.length > 0) {
        hands[p].push(deck.pop()!);
      }
    }
  }
  
  return hands;
}
