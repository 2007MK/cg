import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage, createDeck, shuffleDeck, dealCards, dealRemainingCards } from "./storage";
import { type GameMessage, type Card } from "@shared/schema";

interface GameConnection {
  ws: WebSocket;
  playerId: string;
  gameId: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time game communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const gameConnections = new Map<string, GameConnection[]>();
  
  // Utility function to broadcast to all players in a game
  function broadcastToGame(gameId: string, message: GameMessage) {
    const connections = gameConnections.get(gameId) || [];
    connections.forEach(conn => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(message));
      }
    });
  }
  
  // Create a new game
  app.post("/api/games", async (req, res) => {
    try {
      const { variant = "single_sar" } = req.body;
      
      const game = await storage.createGame({
        status: "waiting",
        phase: "bidding",
        variant,
        currentRound: 1,
        currentPlayer: 0,
        trumpRevealed: false,
        highestBid: 0,
        biddingPlayer: 0,
        gameState: {},
      });
      
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to create game" });
    }
  });
  
  // Join a game
  app.post("/api/games/:gameId/join", async (req, res) => {
    try {
      const { gameId } = req.params;
      const { username } = req.body;
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const existingPlayers = await storage.getPlayersByGame(gameId);
      if (existingPlayers.length >= 4) {
        return res.status(400).json({ error: "Game is full" });
      }
      
      // Create user if doesn't exist
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.createUser({ username, password: "temp" });
      }
      
      const playerNumber = existingPlayers.length;
      const team = playerNumber % 2 === 0 ? "A" : "B";
      
      const player = await storage.createPlayer({
        gameId,
        userId: user.id,
        playerNumber,
        team,
        hand: [],
        bid: 0,
        tricks: 0,
        isConnected: false,
      });
      
      // If this is the 4th player, start the game
      if (existingPlayers.length === 3) {
        await initializeGame(gameId);
      }
      
      res.json({ player, game });
    } catch (error) {
      res.status(500).json({ error: "Failed to join game" });
    }
  });
  
  // Get game state
  app.get("/api/games/:gameId", async (req, res) => {
    try {
      const { gameId } = req.params;
      const game = await storage.getGame(gameId);
      const players = await storage.getPlayersByGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      res.json({ game, players });
    } catch (error) {
      res.status(500).json({ error: "Failed to get game state" });
    }
  });
  
  async function initializeGame(gameId: string) {
    const deck = shuffleDeck(createDeck());
    const players = await storage.getPlayersByGame(gameId);
    
    // Deal initial 5 cards to each player
    const initialHands = dealCards(deck);
    
    for (let i = 0; i < players.length; i++) {
      await storage.updatePlayer(players[i].id, {
        hand: initialHands[i],
      });
    }
    
    // Update game state
    await storage.updateGame(gameId, {
      status: "bidding",
      phase: "bidding",
      gameState: { deck: deck.slice(20), initialHands }, // Save remaining deck
    });
  }
  
  // WebSocket connection handling
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    let connection: GameConnection | null = null;
    
    ws.on('message', async (data) => {
      try {
        const message: GameMessage = JSON.parse(data.toString());
        console.log('WebSocket message received:', message.type, message.gameId, message.playerId);
        
        switch (message.type) {
          case 'join':
            if (message.gameId && message.playerId) {
              connection = {
                ws,
                playerId: message.playerId,
                gameId: message.gameId,
              };
              
              // Add to game connections
              const gameConns = gameConnections.get(message.gameId) || [];
              gameConns.push(connection);
              gameConnections.set(message.gameId, gameConns);
              
              // Update player connection status
              await storage.updatePlayer(message.playerId, { isConnected: true });
              
              // Send current game state with usernames
              const game = await storage.getGame(message.gameId);
              const players = await storage.getPlayersByGame(message.gameId);
              
              // Enrich players with usernames
              const enrichedPlayers = await Promise.all(
                players.map(async (player) => {
                  const user = player.userId ? await storage.getUser(player.userId) : null;
                  return {
                    ...player,
                    username: user?.username || `Player ${player.playerNumber + 1}`,
                  };
                })
              );
              
              const response = {
                type: 'game_update',
                data: { game, players: enrichedPlayers },
              };
              console.log('Sending game update to player:', message.playerId);
              ws.send(JSON.stringify(response));
            }
            break;
            
          case 'bid':
            if (connection) {
              await handleBid(connection, message.data);
            }
            break;
            
          case 'pass':
            if (connection) {
              await handlePass(connection);
            }
            break;
            
          case 'play_card':
            if (connection) {
              await handlePlayCard(connection, message.data);
            }
            break;
            
          case 'reveal_trump':
            if (connection) {
              await handleRevealTrump(connection);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Invalid message format' },
        }));
      }
    });
    
    ws.on('close', async () => {
      if (connection) {
        // Remove from game connections
        const gameConns = gameConnections.get(connection.gameId) || [];
        const filtered = gameConns.filter(conn => conn.playerId !== connection!.playerId);
        gameConnections.set(connection.gameId, filtered);
        
        // Update player connection status
        await storage.updatePlayer(connection.playerId, { isConnected: false });
      }
    });
  });
  
  async function handleBid(connection: GameConnection, bidData: { amount: number }) {
    const game = await storage.getGame(connection.gameId);
    const player = await storage.getPlayer(connection.playerId);
    const players = await storage.getPlayersByGame(connection.gameId);
    
    if (!game || !player || game.phase !== 'bidding') return;
    
    // Validate bid - minimum 9, maximum 13, must be higher than current highest
    const currentHighest = game.highestBid || 8;
    if (bidData.amount < 9 || bidData.amount > 13 || bidData.amount <= currentHighest) {
      connection.ws.send(JSON.stringify({
        type: 'error',
        data: { message: `Bid must be between ${currentHighest + 1} and 13 tricks` },
      }));
      return;
    }
    
    // Validate it's player's turn to bid
    if (game.currentPlayer !== player.playerNumber) {
      connection.ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Not your turn to bid' },
      }));
      return;
    }
    
    // Update player bid
    await storage.updatePlayer(connection.playerId, { bid: bidData.amount });
    
    // Update game with highest bid and move to next player
    const nextPlayer = (game.currentPlayer + 1) % 4;
    await storage.updateGame(connection.gameId, {
      highestBid: bidData.amount,
      biddingPlayer: player.playerNumber,
      currentPlayer: nextPlayer,
    });
    
    // Store bidding history
    const gameState = game.gameState as any;
    if (!gameState.biddingHistory) gameState.biddingHistory = [];
    gameState.biddingHistory.push({
      player: player.playerNumber,
      bid: bidData.amount,
      action: 'bid',
    });
    
    await storage.updateGame(connection.gameId, { gameState });
    
    // Check if bidding should end (simplified: after 4 bids or 3 consecutive passes)
    const updatedPlayers = await storage.getPlayersByGame(connection.gameId);
    const playersWithBids = updatedPlayers.filter(p => p.bid && p.bid > 0);
    
    if (playersWithBids.length >= 4 || gameState.biddingHistory.length >= 8) {
      // End bidding phase, deal remaining cards
      await endBiddingPhase(connection.gameId);
    }
    
    // Broadcast update with usernames
    const updatedGame = await storage.getGame(connection.gameId);
    const updatedGamePlayers = await storage.getPlayersByGame(connection.gameId);
    
    // Enrich players with usernames
    const enrichedPlayers = await Promise.all(
      updatedGamePlayers.map(async (player) => {
        const user = player.userId ? await storage.getUser(player.userId) : null;
        return {
          ...player,
          username: user?.username || `Player ${player.playerNumber + 1}`,
        };
      })
    );
    
    broadcastToGame(connection.gameId, {
      type: 'game_update',
      data: { game: updatedGame, players: enrichedPlayers },
    });
  }
  
  async function handlePlayCard(connection: GameConnection, cardData: { card: Card }) {
    const game = await storage.getGame(connection.gameId);
    const player = await storage.getPlayer(connection.playerId);
    
    if (!game || !player || game.phase !== 'playing') return;
    
    // Validate it's player's turn
    if (game.currentPlayer !== player.playerNumber) {
      connection.ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Not your turn' },
      }));
      return;
    }
    
    // Remove card from hand
    const hand = player.hand as Card[];
    const cardIndex = hand.findIndex(c => c.suit === cardData.card.suit && c.rank === cardData.card.rank);
    
    if (cardIndex === -1) {
      connection.ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Card not in hand' },
      }));
      return;
    }
    
    hand.splice(cardIndex, 1);
    await storage.updatePlayer(connection.playerId, { hand });
    
    // Update game state with played card
    const gameState = game.gameState as any;
    if (!gameState.currentTrick) {
      gameState.currentTrick = [];
    }
    
    gameState.currentTrick.push({
      playerId: connection.playerId,
      playerNumber: player.playerNumber,
      card: cardData.card,
    });
    
    // Move to next player
    const nextPlayer = (game.currentPlayer + 1) % 4;
    
    await storage.updateGame(connection.gameId, {
      currentPlayer: nextPlayer,
      gameState,
    });
    
    // Check if trick is complete (4 cards played)
    if (gameState.currentTrick.length === 4) {
      await resolveTrick(connection.gameId);
    }
    
    // Broadcast update with usernames
    const updatedGame = await storage.getGame(connection.gameId);
    const updatedPlayers = await storage.getPlayersByGame(connection.gameId);
    
    // Enrich players with usernames
    const enrichedPlayers = await Promise.all(
      updatedPlayers.map(async (player) => {
        const user = player.userId ? await storage.getUser(player.userId) : null;
        return {
          ...player,
          username: user?.username || `Player ${player.playerNumber + 1}`,
        };
      })
    );
    
    broadcastToGame(connection.gameId, {
      type: 'game_update',
      data: { game: updatedGame, players: enrichedPlayers },
    });
  }
  
  async function handleRevealTrump(connection: GameConnection) {
    const game = await storage.getGame(connection.gameId);
    
    if (!game || game.trumpRevealed) return;
    
    await storage.updateGame(connection.gameId, {
      trumpRevealed: true,
    });
    
    // Broadcast update with usernames
    const updatedGame = await storage.getGame(connection.gameId);
    const players = await storage.getPlayersByGame(connection.gameId);
    
    // Enrich players with usernames
    const enrichedPlayers = await Promise.all(
      players.map(async (player) => {
        const user = player.userId ? await storage.getUser(player.userId) : null;
        return {
          ...player,
          username: user?.username || `Player ${player.playerNumber + 1}`,
        };
      })
    );
    
    broadcastToGame(connection.gameId, {
      type: 'game_update',
      data: { game: updatedGame, players: enrichedPlayers },
    });
  }
  
  async function resolveTrick(gameId: string) {
    const game = await storage.getGame(gameId);
    if (!game) return;
    
    const gameState = game.gameState as any;
    const trick = gameState.currentTrick;
    
    if (!trick || trick.length !== 4) return;
    
    // Determine winner based on Court Piece rules
    let winner = trick[0];
    const leadSuit = winner.card.suit;
    
    for (let i = 1; i < trick.length; i++) {
      const card = trick[i].card;
      const winnerCard = winner.card;
      
      // Trump cards always win over non-trump
      if (game.trumpRevealed && card.suit === game.trumpSuit && winnerCard.suit !== game.trumpSuit) {
        winner = trick[i];
      } else if (game.trumpRevealed && winnerCard.suit === game.trumpSuit && card.suit !== game.trumpSuit) {
        // Winner stays trump
        continue;
      } else if (game.trumpRevealed && card.suit === game.trumpSuit && winnerCard.suit === game.trumpSuit) {
        // Both trump, higher value wins
        if (card.value > winnerCard.value) {
          winner = trick[i];
        }
      } else if (card.suit === leadSuit && winnerCard.suit === leadSuit) {
        // Both follow suit, higher value wins
        if (card.value > winnerCard.value) {
          winner = trick[i];
        }
      } else if (card.suit === leadSuit && winnerCard.suit !== leadSuit && winnerCard.suit !== game.trumpSuit) {
        // Card follows suit, winner doesn't
        winner = trick[i];
      }
    }
    
    // Update winner's tricks
    const winnerPlayer = await storage.getPlayer(winner.playerId);
    const players = await storage.getPlayersByGame(gameId);
    
    if (winnerPlayer) {
      const newTricks = winnerPlayer.tricks + 1;
      await storage.updatePlayer(winner.playerId, {
        tricks: newTricks,
      });
      
      // Handle consecutive wins for Double Sar and Hidden Trump variants
      if (game.variant === 'double_sar' || game.variant === 'hidden_trump') {
        const team = winnerPlayer.team;
        const previousWinner = gameState.lastTrickWinner;
        
        if (previousWinner && previousWinner.team === team) {
          // Consecutive win - collect all pending tricks
          gameState.consecutiveWins[team]++;
          if (gameState.consecutiveWins[team] >= 2) {
            // Collect all tricks from the table
            gameState.tricksWon = gameState.tricksWon || [];
            gameState.tricksWon.push(...gameState.pendingTricks || []);
            gameState.pendingTricks = [];
            gameState.consecutiveWins[team] = 0;
          }
        } else {
          // Reset consecutive wins for other team
          gameState.consecutiveWins[team === 'A' ? 'B' : 'A'] = 0;
          gameState.consecutiveWins[team] = 1;
        }
        
        gameState.lastTrickWinner = { team, player: winner.playerNumber };
        
        // Store current trick as pending
        if (!gameState.pendingTricks) gameState.pendingTricks = [];
        gameState.pendingTricks.push(trick);
      }
    }
    
    // Clear current trick and set next leader
    gameState.currentTrick = [];
    
    await storage.updateGame(gameId, {
      currentPlayer: winner.playerNumber,
      currentRound: game.currentRound + 1,
      gameState,
    });
    
    // Check for game end conditions
    const updatedPlayers = await storage.getPlayersByGame(gameId);
    const teamATricks = updatedPlayers.filter(p => p.team === "A").reduce((sum, p) => sum + p.tricks, 0);
    const teamBTricks = updatedPlayers.filter(p => p.team === "B").reduce((sum, p) => sum + p.tricks, 0);
    
    // Check win conditions based on variant
    let gameEnded = false;
    if (game.variant === 'single_sar') {
      gameEnded = teamATricks >= 7 || teamBTricks >= 7;
    } else {
      // For double sar and hidden trump, check collected tricks
      const teamACollected = gameState.tricksWon?.filter((t: any) => t.winner?.team === 'A').length || 0;
      const teamBCollected = gameState.tricksWon?.filter((t: any) => t.winner?.team === 'B').length || 0;
      gameEnded = teamACollected >= 7 || teamBCollected >= 7 || game.currentRound >= 13;
    }
    
    if (gameEnded) {
      // Determine winner and update game state
      const winningTeam = teamATricks > teamBTricks ? 'A' : 'B';
      const bidSuccessful = game.biddingPlayer !== null && 
        updatedPlayers.find(p => p.playerNumber === game.biddingPlayer)?.team === winningTeam &&
        (winningTeam === 'A' ? teamATricks : teamBTricks) >= (game.highestBid || 0);
      
      await storage.updateGame(gameId, {
        status: "completed",
        phase: "completed",
        gameState: {
          ...gameState,
          winner: winningTeam,
          bidSuccessful,
          finalScores: { A: teamATricks, B: teamBTricks },
        },
      });
    }
  }

  async function handlePass(connection: GameConnection) {
    const game = await storage.getGame(connection.gameId);
    const player = await storage.getPlayer(connection.playerId);
    
    if (!game || !player || game.phase !== 'bidding') return;
    
    // Validate it's player's turn to bid
    if (game.currentPlayer !== player.playerNumber) {
      connection.ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Not your turn to bid' },
      }));
      return;
    }
    
    // Store pass in bidding history
    const gameState = game.gameState as any;
    if (!gameState.biddingHistory) gameState.biddingHistory = [];
    gameState.biddingHistory.push({
      player: player.playerNumber,
      action: 'pass',
    });
    
    // Move to next player
    const nextPlayer = (game.currentPlayer + 1) % 4;
    await storage.updateGame(connection.gameId, {
      currentPlayer: nextPlayer,
      gameState,
    });
    
    // Check if bidding should end (3 consecutive passes after at least one bid)
    const recentHistory = gameState.biddingHistory.slice(-3);
    const allRecentPasses = recentHistory.length === 3 && recentHistory.every((h: any) => h.action === 'pass');
    const hasBids = gameState.biddingHistory.some((h: any) => h.action === 'bid');
    
    if (allRecentPasses && hasBids) {
      // End bidding phase
      await endBiddingPhase(connection.gameId);
    } else {
      // Broadcast update with usernames
      const updatedGame = await storage.getGame(connection.gameId);
      const players = await storage.getPlayersByGame(connection.gameId);
      
      const enrichedPlayers = await Promise.all(
        players.map(async (player) => {
          const user = player.userId ? await storage.getUser(player.userId) : null;
          return {
            ...player,
            username: user?.username || `Player ${player.playerNumber + 1}`,
          };
        })
      );
      
      broadcastToGame(connection.gameId, {
        type: 'game_update',
        data: { game: updatedGame, players: enrichedPlayers },
      });
    }
  }

  async function endBiddingPhase(gameId: string) {
    const game = await storage.getGame(gameId);
    const players = await storage.getPlayersByGame(gameId);
    
    if (!game) return;
    
    const gameState = game.gameState as any;
    const remainingDeck = gameState.deck || [];
    const currentHands = players.map(p => p.hand as Card[]);
    
    // Deal remaining 8 cards to each player
    const finalHands = dealRemainingCards(remainingDeck, currentHands);
    
    for (let i = 0; i < players.length; i++) {
      await storage.updatePlayer(players[i].id, {
        hand: finalHands[i],
      });
    }
    
    // Find the highest bidder
    const highestBidder = players.find(p => p.playerNumber === game.biddingPlayer);
    
    // For hidden trump variant, set trump card but keep it hidden
    const trumpSuits = ["hearts", "diamonds", "clubs", "spades"];
    const trumpSuit = trumpSuits[Math.floor(Math.random() * 4)];
    
    // Choose a random trump card from the suit
    const trumpRanks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    const trumpValues = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    const randomIndex = Math.floor(Math.random() * trumpRanks.length);
    
    const trumpCard = { 
      suit: trumpSuit, 
      rank: trumpRanks[randomIndex], 
      value: trumpValues[randomIndex] 
    };
    
    // Start playing phase with highest bidder leading
    await storage.updateGame(gameId, {
      phase: 'playing',
      status: 'playing',
      trumpSuit,
      trumpCard,
      trumpRevealed: game.variant === 'single_sar', // Only reveal for single sar
      currentPlayer: game.biddingPlayer || 0,
      gameState: {
        ...gameState,
        currentTrick: [],
        tricksWon: [],
        trumpCaller: game.biddingPlayer,
        consecutiveWins: { A: 0, B: 0 },
      },
    });
    
    // Broadcast the update
    const updatedGame = await storage.getGame(gameId);
    const enrichedPlayers = await Promise.all(
      players.map(async (player) => {
        const user = player.userId ? await storage.getUser(player.userId) : null;
        return {
          ...player,
          username: user?.username || `Player ${player.playerNumber + 1}`,
        };
      })
    );
    
    broadcastToGame(gameId, {
      type: 'game_update',
      data: { game: updatedGame, players: enrichedPlayers },
    });
  }

  return httpServer;
}
