import { Button } from '@/components/ui/button';
import { useGameContext } from '@/contexts/GameContext';

interface GameActionsProps {
  onRevealTrump: () => void;
  canRevealTrump: boolean;
}

export function GameActions({ onRevealTrump, canRevealTrump }: GameActionsProps) {
  const { state } = useGameContext();
  const { game } = state;

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-semibold mb-3 text-yellow-400">Game Actions</h3>
      <div className="space-y-3">
        
        {/* Trump Reveal Actions */}
        <div className="border border-gray-600 rounded p-3">
          <div className="text-sm font-semibold mb-2">Trump Reveal</div>
          <Button 
            onClick={onRevealTrump}
            disabled={!canRevealTrump || game?.trumpRevealed}
            className="bg-yellow-600 hover:bg-yellow-700 w-full mb-2"
          >
            <i className="fas fa-eye mr-2"></i>
            {game?.trumpRevealed ? 'Trump Revealed' : 'Reveal Trump'}
          </Button>
          <div className="text-xs text-gray-400">
            {game?.trumpRevealed 
              ? `Trump suit is ${game.trumpSuit}`
              : 'Available when you can\'t follow suit'
            }
          </div>
        </div>
        
        {/* Game Settings */}
        <div className="border border-gray-600 rounded p-3">
          <div className="text-sm font-semibold mb-2">Settings</div>
          <Button 
            variant="outline"
            className="w-full mb-1 bg-gray-600 hover:bg-gray-700 border-gray-500"
          >
            <i className="fas fa-book mr-2"></i>
            Rules
          </Button>
          <Button 
            variant="outline"
            className="w-full bg-gray-600 hover:bg-gray-700 border-gray-500"
          >
            <i className="fas fa-volume-up mr-2"></i>
            Sound: On
          </Button>
        </div>
        
        <div className="text-xs text-gray-400 text-center">
          Single Sar Variation
        </div>
      </div>
    </div>
  );
}
