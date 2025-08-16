import { Player } from '@/types/game';
import { Card } from './Card';
import { cn } from '@/lib/utils';

interface PlayerAreaProps {
  player: Player;
  position: 'top' | 'bottom' | 'left' | 'right';
  isCurrentUser?: boolean;
  isCurrentTurn?: boolean;
  onCardPlay?: (card: any) => void;
}

export function PlayerArea({ 
  player, 
  position, 
  isCurrentUser = false, 
  isCurrentTurn = false,
  onCardPlay 
}: PlayerAreaProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'absolute top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'absolute bottom-4 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'absolute left-4 top-1/2 transform -translate-y-1/2';
      case 'right':
        return 'absolute right-4 top-1/2 transform -translate-y-1/2';
      default:
        return '';
    }
  };

  const getCardRotation = () => {
    switch (position) {
      case 'left':
        return 90;
      case 'right':
        return -90;
      default:
        return 0;
    }
  };

  const getLayoutClasses = () => {
    if (position === 'left') {
      return 'flex items-center';
    } else if (position === 'right') {
      return 'flex items-center';
    }
    return 'text-center';
  };

  const getCardsContainerClasses = () => {
    if (position === 'left') {
      return 'flex flex-col space-y-1';
    } else if (position === 'right') {
      return 'flex flex-col space-y-1 mr-2';
    }
    return 'flex space-x-1 justify-center';
  };

  const getPlayerInfoClasses = () => {
    if (position === 'left') {
      return 'bg-gray-800 rounded-lg p-3 mr-2 shadow-lg';
    } else if (position === 'right') {
      return 'bg-gray-800 rounded-lg p-3 shadow-lg';
    }
    return 'bg-gray-800 rounded-lg p-3 mb-2 shadow-lg';
  };

  const teamColor = player.team === 'A' ? 'text-green-400' : 'text-blue-400';

  return (
    <div className={getPositionClasses()}>
      <div className={getLayoutClasses()}>
        {position === 'right' && (
          <div className={getCardsContainerClasses()}>
            {player.hand.map((card, index) => (
              <Card
                key={index}
                card={card}
                isHidden={!isCurrentUser}
                size={isCurrentUser ? "md" : "sm"}
                rotation={getCardRotation()}
                isPlayable={isCurrentUser && isCurrentTurn}
                onClick={() => isCurrentUser && isCurrentTurn && onCardPlay?.(card)}
              />
            ))}
          </div>
        )}
        
        <div className={cn(
          getPlayerInfoClasses(),
          isCurrentTurn && 'ring-2 ring-yellow-400 ring-opacity-75'
        )}>
          <div className={cn('text-sm font-semibold', teamColor)}>
            {isCurrentUser ? 'You' : (player.username || `Player ${player.playerNumber + 1}`)}
          </div>
          <div className="text-xs text-gray-400">Team {player.team}</div>
          <div className="text-xs">
            <span>Bid: {player.bid || 0}</span>
            {' | '}
            <span>Tricks: {player.tricks || 0}</span>
          </div>
          {player.isConnected === false && (
            <div className="text-xs text-red-400">Disconnected</div>
          )}
        </div>

        {position !== 'right' && (
          <div className={getCardsContainerClasses()}>
            {player.hand.map((card, index) => (
              <Card
                key={index}
                card={card}
                isHidden={!isCurrentUser}
                size={isCurrentUser ? "md" : "sm"}
                rotation={getCardRotation()}
                isPlayable={isCurrentUser && isCurrentTurn}
                onClick={() => isCurrentUser && isCurrentTurn && onCardPlay?.(card)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
