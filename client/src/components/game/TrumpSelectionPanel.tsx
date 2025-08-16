import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGameContext } from '@/contexts/GameContext';
import { Card as CardType } from '@/types/game';
import { Heart, Diamond, Club, Spade } from 'lucide-react';

interface TrumpSelectionPanelProps {
  onSelectTrump: (suit: string, card: CardType) => void;
  isMyTurn: boolean;
}

export function TrumpSelectionPanel({ onSelectTrump, isMyTurn }: TrumpSelectionPanelProps) {
  const { state } = useGameContext();
  const { game, currentPlayer } = state;
  const [selectedSuit, setSelectedSuit] = useState<string>('');

  if (game?.phase !== 'trump_selection') {
    return null;
  }

  const suits = [
    { name: 'hearts', icon: Heart, color: 'text-red-500', label: 'Hearts' },
    { name: 'diamonds', icon: Diamond, color: 'text-red-500', label: 'Diamonds' },
    { name: 'clubs', icon: Club, color: 'text-black', label: 'Clubs' },
    { name: 'spades', icon: Spade, color: 'text-black', label: 'Spades' },
  ];

  const handleSelectTrump = () => {
    if (!selectedSuit || !currentPlayer) return;
    
    // Create a trump card from the selected suit
    const trumpCard: CardType = {
      suit: selectedSuit as any,
      rank: 'A', // Default to Ace for trump card
      value: 14,
    };
    
    onSelectTrump(selectedSuit, trumpCard);
  };

  const highestBidder = game?.biddingPlayer;
  const isHighestBidder = currentPlayer?.playerNumber === highestBidder;

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-semibold mb-3 text-yellow-400">Trump Selection</h3>
      <div className="space-y-4">
        
        <div className="text-sm">
          <span className="text-gray-400">Highest Bidder:</span>
          <span className="text-yellow-400 font-semibold ml-2">
            Player {(highestBidder ?? 0) + 1}
          </span>
        </div>
        
        <div className="text-sm">
          <span className="text-gray-400">Winning Bid:</span>
          <span className="text-white font-semibold ml-2">
            {game?.highestBid || 0} tricks
          </span>
        </div>

        {isMyTurn && isHighestBidder ? (
          <>
            <div className="text-sm font-semibold text-yellow-400 mb-3">
              Choose your trump suit:
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {suits.map((suit) => {
                const SuitIcon = suit.icon;
                return (
                  <Button
                    key={suit.name}
                    onClick={() => setSelectedSuit(suit.name)}
                    variant={selectedSuit === suit.name ? "default" : "outline"}
                    className={`h-16 flex flex-col items-center justify-center ${
                      selectedSuit === suit.name 
                        ? 'bg-yellow-600 hover:bg-yellow-700 border-yellow-500' 
                        : 'bg-gray-700 hover:bg-gray-600 border-gray-500'
                    }`}
                    data-testid={`button-select-trump-${suit.name}`}
                  >
                    <SuitIcon className={`w-6 h-6 ${suit.color} mb-1`} />
                    <span className="text-xs">{suit.label}</span>
                  </Button>
                );
              })}
            </div>
            
            <Button 
              onClick={handleSelectTrump}
              disabled={!selectedSuit}
              className="w-full bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-trump"
            >
              <i className="fas fa-check mr-2"></i>
              Confirm Trump: {selectedSuit && suits.find(s => s.name === selectedSuit)?.label}
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-sm text-gray-400">
              {isHighestBidder 
                ? 'You won the bid! Choose your trump suit.' 
                : `Waiting for Player ${(highestBidder ?? 0) + 1} to select trump...`
              }
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-400 text-center">
          {game?.variant === 'single_sar' 
            ? 'Trump will be revealed immediately (Open Trump)'
            : 'Trump card will be placed face down'
          }
        </div>
      </div>
    </div>
  );
}