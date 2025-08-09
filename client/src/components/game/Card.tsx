import { Card as CardType } from '@/types/game';
import { cn } from '@/lib/utils';

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  isHidden?: boolean;
  size?: 'sm' | 'md' | 'lg';
  rotation?: number;
  onClick?: () => void;
  className?: string;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-black',
  spades: 'text-black',
};

const cardSizes = {
  sm: 'w-8 h-11',
  md: 'w-12 h-16',
  lg: 'w-16 h-22',
};

export function Card({ 
  card, 
  isPlayable = false, 
  isHidden = false, 
  size = 'md', 
  rotation = 0,
  onClick,
  className 
}: CardProps) {
  if (isHidden) {
    return (
      <div 
        className={cn(
          'card card-back border border-gray-300',
          cardSizes[size],
          rotation !== 0 && `transform rotate-${rotation}`,
          className
        )}
        style={rotation !== 0 ? { transform: `rotate(${rotation}deg)` } : undefined}
      />
    );
  }

  return (
    <div
      className={cn(
        'card bg-white border border-gray-300 flex items-center justify-center cursor-pointer',
        cardSizes[size],
        isPlayable && 'hover:scale-105 hover:-translate-y-1 transition-transform',
        rotation !== 0 && `transform rotate-${rotation}`,
        className
      )}
      style={rotation !== 0 ? { transform: `rotate(${rotation}deg)` } : undefined}
      onClick={onClick}
    >
      <div className="text-center">
        <div className={cn('font-bold', size === 'sm' ? 'text-sm' : 'text-lg', suitColors[card.suit])}>
          {card.rank}
        </div>
        <div className={cn(size === 'sm' ? 'text-xs' : 'text-sm', suitColors[card.suit])}>
          {suitSymbols[card.suit]}
        </div>
      </div>
    </div>
  );
}
