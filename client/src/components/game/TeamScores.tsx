import { Player } from '@/types/game';

interface TeamScoresProps {
  players: Player[];
}

export function TeamScores({ players }: TeamScoresProps) {
  const teamA = players.filter(p => p.team === 'A');
  const teamB = players.filter(p => p.team === 'B');
  
  const teamATricks = teamA.reduce((sum, p) => sum + p.tricks, 0);
  const teamBTricks = teamB.reduce((sum, p) => sum + p.tricks, 0);

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-semibold mb-3 text-yellow-400">Team Scores</h3>
      <div className="space-y-4">
        <div className="bg-green-900 rounded p-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-semibold text-green-400">Team A</div>
              <div className="text-xs text-gray-400">
                {teamA.map(p => `Player ${p.playerNumber + 1}`).join(' & ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{teamATricks}</div>
              <div className="text-xs text-gray-400">tricks</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900 rounded p-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-semibold text-blue-400">Team B</div>
              <div className="text-xs text-gray-400">
                {teamB.map(p => `Player ${p.playerNumber + 1}`).join(' & ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{teamBTricks}</div>
              <div className="text-xs text-gray-400">tricks</div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 text-center">
          First team to 7+ tricks wins
        </div>
      </div>
    </div>
  );
}
