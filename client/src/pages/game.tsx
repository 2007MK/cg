import { useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { GameProvider, useGameContext } from '@/contexts/GameContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { GameHeader } from '@/components/game/GameHeader';
import { GameTable } from '@/components/game/GameTable';
import { BiddingPanel } from '@/components/game/BiddingPanel';
import { TeamScores } from '@/components/game/TeamScores';
import { GameActions } from '@/components/game/GameActions';
import { Button } from '@/components/ui/button';
import { Card as CardType, GameMessage } from '@/types/game';
import { useToast } from '@/hooks/use-toast';

function GameContent() {
  const { gameId } = useParams();
  const [location] = useLocation();
  const { state, dispatch } = useGameContext();
  const { toast } = useToast();

  // Extract playerId and username from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const playerId = urlParams.get('playerId');
  const username = urlParams.get('username');

  const handleWebSocketMessage = useCallback((message: GameMessage) => {
    console.log('Received WebSocket message:', message);
    switch (message.type) {
      case 'game_update':
        console.log('Processing game update:', message.data);
        
        // Set connection status when we receive game data
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
        
        dispatch({
          type: 'SET_GAME_STATE',
          payload: {
            game: message.data.game,
            players: message.data.players,
          },
        });
        
        // Set current player
        const currentUserPlayer = message.data.players.find((p: any) => p.id === playerId);
        console.log('Found current user player:', currentUserPlayer);
        if (currentUserPlayer) {
          dispatch({
            type: 'SET_CURRENT_PLAYER',
            payload: currentUserPlayer,
          });
        }
        break;
        
      case 'error':
        console.error('Game error received:', message.data);
        toast({
          title: "Game Error",
          description: message.data.message,
          variant: "destructive",
        });
        break;
    }
  }, [dispatch, playerId, toast]);

  const { isConnected, sendMessage } = useWebSocket({
    gameId,
    playerId: playerId || undefined,
    onMessage: handleWebSocketMessage,
  });

  useEffect(() => {
    console.log('Connection status changed:', isConnected);
    if (isConnected) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
    }
  }, [isConnected, dispatch]);

  const handleBid = (amount: number) => {
    sendMessage({
      type: 'bid',
      data: { amount },
      playerId: playerId || undefined,
      gameId: gameId || undefined,
    });
  };

  const handlePass = () => {
    // For now, just send a bid of 0 to indicate pass
    toast({
      title: "Pass",
      description: "You passed this bidding round",
    });
  };

  const handleCardPlay = (card: CardType) => {
    sendMessage({
      type: 'play_card',
      data: { card },
      playerId: playerId || undefined,
      gameId: gameId || undefined,
    });
  };

  const handleRevealTrump = () => {
    sendMessage({
      type: 'reveal_trump',
      data: {},
      playerId: playerId || undefined,
      gameId: gameId || undefined,
    });
  };

  const { game, players, currentPlayer } = state;
  
  // Log current state for debugging
  useEffect(() => {
    console.log('Current game state:', { game, players, currentPlayer, isConnected });
  }, [game, players, currentPlayer, isConnected]);
  
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <div className="text-white">Connecting to game...</div>
          <div className="text-xs text-gray-400 mt-2">
            Game ID: {gameId}<br/>
            Player ID: {playerId}
          </div>
          <div className="mt-4">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!game || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white">Loading game state...</div>
          <div className="text-xs text-gray-400 mt-2">
            Connected: {isConnected ? 'Yes' : 'No'}<br/>
            Game: {game ? 'Loaded' : 'Loading'}<br/>
            Player: {currentPlayer ? 'Found' : 'Loading'}
          </div>
        </div>
      </div>
    );
  }

  const isMyTurn = game.currentPlayer === currentPlayer.playerNumber;
  const canRevealTrump = isMyTurn && game.phase === 'playing' && !game.trumpRevealed;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <GameHeader />
      
      <main className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <GameTable onCardPlay={handleCardPlay} />
          
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <BiddingPanel
              onBid={handleBid}
              onPass={handlePass}
              isMyTurn={isMyTurn}
            />
            
            <TeamScores players={players} />
            
            <GameActions
              onRevealTrump={handleRevealTrump}
              canRevealTrump={canRevealTrump}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Game() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
