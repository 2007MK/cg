import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useGameContext } from '@/contexts/GameContext';

interface BiddingPanelProps {
  onBid: (amount: number) => void;
  onPass: () => void;
  isMyTurn: boolean;
}

export function BiddingPanel({ onBid, onPass, isMyTurn }: BiddingPanelProps) {
  const { state } = useGameContext();
  const { game } = state;
  const [bidAmount, setBidAmount] = useState([game?.highestBid ? game.highestBid + 1 : 9]);

  const handleBid = () => {
    onBid(bidAmount[0]);
  };

  const handlePass = () => {
    onPass();
  };

  const minBid = Math.max(9, (game?.highestBid || 8) + 1);
  const maxBid = 13;

  if (game?.phase !== 'bidding') {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-semibold mb-3 text-yellow-400">Bidding Phase</h3>
      <div className="space-y-3">
        <div className="text-sm">
          <span className="text-gray-400">Current Highest Bid:</span>
          <span className="text-white font-semibold ml-2">
            {game?.highestBid || 0} tricks
          </span>
        </div>
        
        {isMyTurn ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Your Bid:</span>
                <span className="text-white font-bold">{bidAmount[0]}</span>
              </div>
              <Slider
                value={bidAmount}
                onValueChange={setBidAmount}
                min={minBid}
                max={maxBid}
                step={1}
                className="w-full"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleBid}
                className="bg-green-600 hover:bg-green-700 flex-1"
                disabled={bidAmount[0] < minBid}
              >
                <i className="fas fa-hand-paper mr-2"></i>
                Bid {bidAmount[0]}
              </Button>
              <Button 
                onClick={handlePass}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 flex-1"
              >
                <i className="fas fa-times mr-2"></i>
                Pass
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-sm text-gray-400">Waiting for other players to bid...</div>
          </div>
        )}
        
        <div className="text-xs text-gray-400">
          3 players must pass for bidding to end
        </div>
      </div>
    </div>
  );
}
