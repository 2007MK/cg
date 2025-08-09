import { useGameContext } from '@/contexts/GameContext';
import { PlayerArea } from './PlayerArea';
import { CenterPlayArea } from './CenterPlayArea';
import { TrickCard } from '@/types/game';

interface GameTableProps {
  onCardPlay: (card: any) => void;
}

export function GameTable({ onCardPlay }: GameTableProps) {
  const { state } = useGameContext();
  const { game, players, currentPlayer } = state;

  if (!game || players.length === 0) {
    return (
      <div className="table-felt rounded-2xl p-8 relative min-h-[600px] shadow-2xl flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-lg">Waiting for game to start...</div>
          <div className="text-sm text-gray-400 mt-2">
            {players.length}/4 players connected
          </div>
        </div>
      </div>
    );
  }

  // Arrange players: current user at bottom, others clockwise
  const currentUserPlayer = currentPlayer || players[0];
  const otherPlayers = players.filter(p => p.id !== currentUserPlayer?.id);
  
  // Positions: bottom (current user), top, left, right
  const positions = ['bottom', 'top', 'left', 'right'];
  const arrangedPlayers = [currentUserPlayer, ...otherPlayers.slice(0, 3)];

  const currentTrick = game.gameState?.currentTrick as TrickCard[] || [];
  const currentTurnPlayer = players.find(p => p.playerNumber === game.currentPlayer);
  const isMyTurn = currentTurnPlayer?.id === currentUserPlayer?.id;

  return (
    <div className="table-felt rounded-2xl p-8 relative min-h-[600px] shadow-2xl">
      {arrangedPlayers.map((player, index) => {
        if (!player) return null;
        
        const position = positions[index] as 'top' | 'bottom' | 'left' | 'right';
        const isCurrentUser = player.id === currentUserPlayer?.id;
        const isCurrentTurn = player.playerNumber === game.currentPlayer;
        
        return (
          <PlayerArea
            key={player.id}
            player={player}
            position={position}
            isCurrentUser={isCurrentUser}
            isCurrentTurn={isCurrentTurn}
            onCardPlay={isCurrentUser && isMyTurn ? onCardPlay : undefined}
          />
        );
      })}

      <CenterPlayArea 
        game={game}
        currentTrick={currentTrick}
        currentPlayerName={currentTurnPlayer ? `Player ${currentTurnPlayer.playerNumber + 1}` : undefined}
      />
    </div>
  );
}
