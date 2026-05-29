import React, { useState, useEffect, useRef, useCallback } from 'react';
import BluetoothPanel from './components/BluetoothPanel';
import BiometricsDisplay from './components/BiometricsDisplay';
import AudioPlayer from './components/AudioPlayer';
import SessionLog from './components/SessionLog';

const WS_URL = import.meta.env.PROD
  ? `wss://${window.location.host}/ws`
  : 'ws://localhost:3000/ws';

export default function App() {
  const [biometrics, setBiometrics] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected'); // disconnected | connecting | connected
  const [musicParams, setMusicParams] = useState(null);
  const wsRef = useRef(null);

  const connectWebSocket = useCallback((token) => {
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;
    setWsStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus('connected');
    ws.onclose = () => setWsStatus('disconnected');
    ws.onerror = () => setWsStatus('disconnected');

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'audio_update') {
        setAudioData({ url: msg.audioUrl, duration: msg.duration });
        setMusicParams(msg.musicParams);
      }
    };

    return ws;
  }, []);

  // Send biometric data to WebSocket server
  const sendBiometrics = useCallback((metrics) => {
    setBiometrics(metrics);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'biometrics', ...metrics }));
    }
  }, []);

  // Auto-connect WS on mount
  useEffect(() => {
    const token = localStorage.getItem('anahata_token');
    connectWebSocket(token);
    return () => wsRef.current?.close();
  }, [connectWebSocket]);

  return (
    <div className="app">
      <header className="header">
        <h1>✦ Anahata</h1>
        <p>Let your heart lead the music</p>
      </header>

      <BluetoothPanel onBiometrics={sendBiometrics} wsStatus={wsStatus} />
      {biometrics && <BiometricsDisplay biometrics={biometrics} musicParams={musicParams} />}
      {audioData && <AudioPlayer audioData={audioData} musicParams={musicParams} />}
      <SessionLog />
    </div>
  );
}
