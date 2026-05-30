import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`;

/**
 * useWebSocket — manages WebSocket lifecycle for biometric streaming
 * @returns {{ status, lastMessage, send }}
 */
export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus]           = useState('disconnected'); // connecting | connected | disconnected | error
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => { if (mountedRef.current) setStatus('connected'); };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (mountedRef.current) setLastMessage(data);
      } catch {}
    };
    ws.onerror = () => { if (mountedRef.current) setStatus('error'); };
    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus('disconnected');
      reconnectTimer.current = setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current !== null) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { status, lastMessage, send };
}
