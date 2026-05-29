import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.PROD
  ? `wss://${window.location.host}/ws`
  : 'ws://localhost:3000/ws';

export function useWebSocket(token) {
  const wsRef = useRef(null);
  const [status, setStatus] = useState('disconnected'); // disconnected | connecting | connected
  const [lastAudio, setLastAudio] = useState(null);
  const [lastMusicParams, setLastMusicParams] = useState(null);

  useEffect(() => {
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;
    setStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen  = () => setStatus('connected');
    ws.onclose = () => setStatus('disconnected');
    ws.onerror = () => setStatus('disconnected');

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'audio_update') {
          setLastAudio({ url: msg.audioUrl, duration: msg.duration });
          setLastMusicParams(msg.musicParams);
        }
      } catch {}
    };

    return () => ws.close();
  }, [token]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { status, lastAudio, lastMusicParams, send };
}
