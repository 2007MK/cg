import { useGameContext } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export function GameHeader() {
  const { state } = useGameContext();
  const [, setLocation] = useLocation();
  const { game } = state;

  const handleExitGame = () => {
    setLocation('/');
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-yellow-400">Court Piece</h1>
          <span className="text-sm bg-gray-700 px-2 py-1 rounded capitalize">
            {game?.variant?.replace('_', ' ') || 'Single Sar'}
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-sm">
            <span className="text-gray-400">Phase:</span>
            <span className="text-yellow-400 font-semibold ml-1 capitalize">
              {game?.phase || 'Waiting'}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Round:</span>
            <span className="text-white font-semibold ml-1">
              {game?.currentRound || 1}/13
            </span>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleExitGame}
            className="bg-red-600 hover:bg-red-700"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Exit Game
          </Button>
        </div>
      </div>
    </header>
  );
}
