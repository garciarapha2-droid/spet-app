/**
 * WebSocket hook — real-time venue events.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { WS_BASE_URL, API_PREFIX } from '../config/api';

type EventType = 'guest_entered' | 'nfc_scanned' | 'tab_updated' | 'tab_closed';

interface WsEvent {
  type: EventType;
  data: any;
}

export function useWebSocket(venueId: string, onEvent?: (event: WsEvent) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!venueId) return;

    const url = `${WS_BASE_URL}${API_PREFIX}/ws/manager/${venueId}`;
    const socket = new WebSocket(url);

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onEvent?.(parsed);
      } catch {
        // non-JSON message, ignore
      }
    };

    socket.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    socket.onerror = () => {
      socket.close();
    };

    ws.current = socket;
  }, [venueId, onEvent]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
  }, [connect]);

  return { connected };
}
