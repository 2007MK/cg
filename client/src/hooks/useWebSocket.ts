import { useEffect, useRef, useState } from 'react';
import { GameMessage } from '@/types/game';

interface UseWebSocketProps {
  gameId?: string;
  playerId?: string;
  onMessage?: (message: GameMessage) => void;
}

export function useWebSocket({ gameId, playerId, onMessage }: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = (message: GameMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    if (!gameId || !playerId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      
      // Join the game
      sendMessage({
        type: 'join',
        gameId,
        playerId,
        data: {},
      });
    };

    ws.onmessage = (event) => {
      try {
        const message: GameMessage = JSON.parse(event.data);
        onMessage?.(message);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [gameId, playerId, onMessage]);

  return {
    isConnected,
    error,
    sendMessage,
  };
}
