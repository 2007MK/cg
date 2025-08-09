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
      console.log('WebSocket connected');
      
      // Join the game immediately when connection opens
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'join',
          gameId,
          playerId,
          data: {},
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: GameMessage = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        onMessage?.(message);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [gameId, playerId]);

  return {
    isConnected,
    error,
    sendMessage,
  };
}
