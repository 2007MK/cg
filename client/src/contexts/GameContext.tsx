import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Game, Player, GameMessage } from '@/types/game';

interface GameState {
  game: Game | null;
  players: Player[];
  currentPlayer: Player | null;
  isConnected: boolean;
  error: string | null;
}

type GameAction = 
  | { type: 'SET_GAME_STATE'; payload: { game: Game; players: Player[] } }
  | { type: 'SET_CURRENT_PLAYER'; payload: Player }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_GAME' };

const initialState: GameState = {
  game: null,
  players: [],
  currentPlayer: null,
  isConnected: false,
  error: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return {
        ...state,
        game: action.payload.game,
        players: action.payload.players,
      };
    case 'SET_CURRENT_PLAYER':
      return {
        ...state,
        currentPlayer: action.payload,
      };
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'RESET_GAME':
      return initialState;
    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
