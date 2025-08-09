import { Game, TrickCard } from '@/types/game';
import { Card } from './Card';

interface CenterPlayAreaProps {
  game: Game;
  currentTrick?: TrickCard[];
  currentPlayerName?: string;
}

export function CenterPlayArea({ game, currentTrick = [], currentPlayerName }: CenterPlayAreaProps) {
  // Arrange cards in positions: top (player 1), left (player 2), right (player 3), bottom (player 0)
  const getCardByPosition = (position: number) => {
    return currentTrick.find(trick => trick.playerNumber === position);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        {/* Current Trick Cards */}
        <div className="grid grid-cols-3 gap-4 w-48 h-48 relative mb-4">
          {/* Top card (Player 2) */}
          <div className="col-start-2 justify-self-center">
            {getCardByPosition(1) ? (
              <Card card={getCardByPosition(1)!.card} size="md" />
            ) : (
              <div className="w-12 h-16 border-2 border-dashed border-gray-500 rounded opacity-50" />
            )}
          </div>
          
          {/* Left card (Player 3) */}
          <div className="row-start-2 justify-self-start self-center">
            {getCardByPosition(2) ? (
              <Card card={getCardByPosition(2)!.card} size="md" />
            ) : (
              <div className="w-12 h-16 border-2 border-dashed border-gray-500 rounded opacity-50" />
            )}
          </div>
          
          {/* Right card (Player 4) */}
          <div className="row-start-2 col-start-3 justify-self-end self-center">
            {getCardByPosition(3) ? (
              <Card card={getCardByPosition(3)!.card} size="md" />
            ) : (
              <div className="w-12 h-16 border-2 border-dashed border-gray-500 rounded opacity-50" />
            )}
          </div>
          
          {/* Bottom card (Player 1) */}
          <div className="row-start-3 col-start-2 justify-self-center">
            {getCardByPosition(0) ? (
              <Card card={getCardByPosition(0)!.card} size="md" />
            ) : (
              <div className="w-12 h-16 border-2 border-dashed border-yellow-400 rounded flex items-center justify-center">
                <i className="fas fa-plus text-yellow-400"></i>
              </div>
            )}
          </div>
        </div>

        {/* Trump Card */}
        <div className="mb-4">
          <div className="text-xs text-gray-300 mb-1">Trump Card</div>
          {game.trumpRevealed && game.trumpCard ? (
            <Card card={game.trumpCard} size="md" />
          ) : (
            <div className="w-12 h-16 card-back mx-auto trump-indicator" />
          )}
          <div className="text-xs text-yellow-400 mt-1">
            {game.trumpRevealed ? `Trump: ${game.trumpSuit}` : 'Hidden'}
          </div>
        </div>

        {/* Turn Indicator */}
        <div className="bg-gray-800 rounded-lg p-2 inline-block">
          <div className="text-xs text-gray-400">Current Turn</div>
          <div className="text-sm font-semibold text-blue-400">
            {currentPlayerName || `Player ${(game.currentPlayer || 0) + 1}`}
          </div>
        </div>
      </div>
    </div>
  );
}
