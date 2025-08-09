import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { GameVariant, GAME_VARIANTS } from '@shared/schema';

export default function Lobby() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [gameId, setGameId] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>('single_sar');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  const handleCreateGame = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter your username",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiRequest('POST', '/api/games', {
        variant: selectedVariant,
      });
      const game = await response.json();
      
      // Join the created game
      await handleJoinGame(game.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async (gameIdToJoin?: string) => {
    const targetGameId = gameIdToJoin || gameId;
    
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter your username",
        variant: "destructive",
      });
      return;
    }

    if (!targetGameId.trim()) {
      toast({
        title: "Error",
        description: "Please enter game ID",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const response = await apiRequest('POST', `/api/games/${targetGameId}/join`, {
        username: username.trim(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join game');
      }
      
      const { player, game } = await response.json();
      
      console.log('Successfully joined game:', { gameId: game.id, playerId: player.id });
      console.log('Navigation URL:', `/game/${game.id}?playerId=${player.id}&username=${username}`);
      
      // Navigate to game with player ID
      setLocation(`/game/${game.id}?playerId=${player.id}&username=${username}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join game",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Court Piece</h1>
          <p className="text-gray-400">Traditional Pakistani Card Game</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Enter Game</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Your Username</label>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Game Variant</label>
              <Select value={selectedVariant} onValueChange={(value: GameVariant) => setSelectedVariant(value)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select game variant" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GAME_VARIANTS).map(([key, variant]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span className="font-medium">{variant.name}</span>
                        <span className="text-xs text-gray-400">{variant.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Game variant details */}
            {selectedVariant && (
              <div className="bg-gray-700 rounded p-3 text-sm">
                <div className="font-semibold text-yellow-400 mb-2">
                  {GAME_VARIANTS[selectedVariant].name} Rules:
                </div>
                <ul className="space-y-1 text-gray-300">
                  {GAME_VARIANTS[selectedVariant].rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleCreateGame}
                disabled={isCreating || isJoining}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isCreating ? 'Creating...' : `Create ${GAME_VARIANTS[selectedVariant].name} Game`}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-gray-400">Or</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Game ID</label>
                <Input
                  type="text"
                  placeholder="Enter game ID to join"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button
                onClick={() => handleJoinGame()}
                disabled={isCreating || isJoining}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isJoining ? 'Joining...' : 'Join Game'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Court Piece is a 4-player card game played in teams.</p>
          <p>Players 1 & 3 vs Players 2 & 4</p>
        </div>
      </div>
    </div>
  );
}
