import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useBluetooth } from '../hooks/useBluetooth';
import { useSimulator } from '../hooks/useSimulator';
import BluetoothPanel from '../components/BluetoothPanel';
import HeroMetrics from '../components/HeroMetrics';
import AudioPlayerCard from '../components/AudioPlayerCard';
import MetricsGrid from '../components/MetricsGrid';

export default function DashboardPage() {
  const { token } = useAuth();
  const [heartRate, setHeartRate] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const { status: wsStatus, lastAudio, lastMusicParams, send } = useWebSocket(token);

  const handleHR = useCallback((bpm) => {
    setHeartRate(bpm);
    send({ type: 'biometrics', heartRate: bpm });
  }, [send]);

  const { status: bleStatus, deviceName, error: bleError, connect, disconnect } = useBluetooth(handleHR);
  const { running: simRunning, start: startSim, stop: stopSim } = useSimulator(handleHR);

  function toggleDemo() {
    if (simRunning) { stopSim(); setIsDemo(false); setHeartRate(null); }
    else { setIsDemo(true); startSim(); }
  }

  return (
    <div className="dashboard fade-in">
      {isDemo && (
        <div className="demo-banner">
          <span>⚠</span>
          Demo mode — simulating heart rate data
          <button className="btn btn-ghost" style={{ marginLeft: 'auto', height: 28, padding: '0 10px', fontSize: 11 }} onClick={toggleDemo}>Stop</button>
        </div>
      )}

      <HeroMetrics heartRate={heartRate} musicParams={lastMusicParams} wsStatus={wsStatus} />

      <BluetoothPanel
        bleStatus={bleStatus}
        deviceName={deviceName}
        error={bleError}
        onConnect={connect}
        onDisconnect={disconnect}
        isDemo={isDemo}
        onToggleDemo={toggleDemo}
      />

      {lastMusicParams && <MetricsGrid params={lastMusicParams} />}
      {lastAudio && <AudioPlayerCard audioData={lastAudio} musicParams={lastMusicParams} />}
    </div>
  );
}
