import { useGameContext } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { useLocation, useParams } from 'wouter';
import { Copy, Share2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function GameHeader() {
  const { state } = useGameContext();
  const [, setLocation] = useLocation();
  const { gameId } = useParams();
  const { game, players } = state;
  const { toast } = useToast();

  const handleExitGame = () => {
    setLocation('/');
  };

  const copyGameId = () => {
    navigator.clipboard.writeText(gameId || '');
    toast({
      title: "Game ID Copied",
      description: "Share this ID with other players to join the game",
    });
  };

  const shareGame = () => {
    const gameUrl = `${window.location.origin}/?join=${gameId}`;
    navigator.clipboard.writeText(gameUrl);
    toast({
      title: "Game Link Copied", 
      description: "Share this link with other players",
    });
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
          <div className="flex items-center space-x-2 text-gray-400">
            <Users className="h-5 w-5" />
            <span>{players?.length || 0}/4 Players</span>
          </div>
          
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

          <div className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded">
            <div className="text-right">
              <p className="text-xs text-gray-400">Game ID</p>
              <p className="text-sm text-white font-mono">{gameId?.slice(0, 8)}...</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyGameId}
              className="h-6 w-6 p-0 hover:bg-gray-600"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={shareGame}
              className="h-6 w-6 p-0 hover:bg-gray-600"
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleExitGame}
            className="bg-red-600 hover:bg-red-700"
          >
            Exit Game
          </Button>
        </div>
      </div>
    </header>
  );
}
