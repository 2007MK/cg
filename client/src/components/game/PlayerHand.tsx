import { useGameContext } from '@/contexts/GameContext';
import { Card as CardType } from '@/types/game';
import { Card } from './Card';

interface PlayerHandProps {
  onCardPlay: (card: CardType) => void;
}

export function PlayerHand({ onCardPlay }: PlayerHandProps) {
  const { state } = useGameContext();
  const { game, currentPlayer } = state;

  if (!currentPlayer || !game) return null;

  const isMyTurn = game.currentPlayer === currentPlayer.playerNumber;
  const canPlayCard = isMyTurn && game.phase === 'playing';

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-semibold mb-3 text-yellow-400">Your Hand</h3>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {(currentPlayer.hand as CardType[]).map((card, index) => (
          <div key={`${card.suit}-${card.rank}-${index}`} className="relative">
            <Card
              card={card}
              onClick={() => canPlayCard && onCardPlay(card)}
              className={`
                cursor-pointer transition-all duration-200 transform hover:scale-105
                ${canPlayCard 
                  ? 'hover:shadow-lg hover:-translate-y-2 border-2 border-transparent hover:border-yellow-400' 
                  : 'opacity-50 cursor-not-allowed'
                }
              `}
              data-testid={`card-${card.suit}-${card.rank}`}
            />
            {canPlayCard && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                ✓
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-center">
        <div className="text-sm text-gray-400">
          {canPlayCard ? (
            <span className="text-green-400 font-semibold">
              Your turn - Select a card to play
            </span>
          ) : game.phase === 'playing' ? (
            <span>
              Waiting for Player {(game.currentPlayer || 0) + 1}
            </span>
          ) : (
            <span>Cards: {(currentPlayer.hand as CardType[]).length}</span>
          )}
        </div>
        
        {game.trumpRevealed && (
          <div className="text-sm mt-2">
            <span className="text-gray-400">Trump: </span>
            <span className="text-yellow-400 font-semibold capitalize">
              {game.trumpSuit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}