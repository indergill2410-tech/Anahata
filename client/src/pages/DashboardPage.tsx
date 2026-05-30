import React, { useEffect, useState } from 'react';
import HeroMetrics from '../components/HeroMetrics';
import MetricsGrid from '../components/MetricsGrid';
import AudioPlayerCard from '../components/AudioPlayerCard';
import BluetoothPanel from '../components/BluetoothPanel';
import { useWebSocket } from '../hooks/useWebSocket';
import { useBluetooth } from '../hooks/useBluetooth';
import { useSimulator } from '../hooks/useSimulator';
import { useToast } from '../context/ToastContext';

interface WsMessage { type?: string; heartRate?: number; brainwaveState?: string; targetHeartRate?: number; musicalTempo?: number; binauralHz?: number; audioUrl?: string; }
interface MeditationState { brainwaveState?: string; targetHeartRate?: number; musicalTempo?: number; binauralHz?: number; audioUrl?: string; }

export default function DashboardPage() {
  const ws  = useWebSocket();
  const ble = useBluetooth();
  const sim = useSimulator();
  const { info } = useToast();

  const [meditation, setMeditation] = useState<MeditationState | null>(null);
  const [demoMode, setDemoMode]     = useState(false);

  const msg = ws.lastMessage as WsMessage | null;

  // Heart rate source priority: BLE > Simulator > WS
  const heartRate = ble.status === 'connected' ? ble.heartRate
                  : demoMode                   ? sim.heartRate
                  : msg?.heartRate  || null;

  // Send HR to server when available
  useEffect(() => {
    if (heartRate && ws.status === 'connected') {
      ws.send({ type: 'biometric', heartRate });
    }
  }, [heartRate, ws.status]);

  // Receive meditation response from WS
  useEffect(() => {
    if (msg?.type === 'meditation') {
      setMeditation(msg as MeditationState);
    }
  }, [ws.lastMessage]);

  function toggleDemo() {
    if (demoMode) { sim.stop(); setDemoMode(false); }
    else          { sim.start(); setDemoMode(true); info('Demo mode on — simulating HR data 🎭'); }
  }

  return (
    <div className="dashboard fade-in">
      <HeroMetrics
        heartRate={heartRate ?? undefined}
        brainwaveState={meditation?.brainwaveState}
        wsStatus={ws.status}
      />
      <MetricsGrid
        targetHR={meditation?.targetHeartRate}
        tempo={meditation?.musicalTempo}
        binauralHz={meditation?.binauralHz}
        brainwaveState={meditation?.brainwaveState}
      />
      <AudioPlayerCard
        audioUrl={meditation?.audioUrl}
        isLoading={!meditation}
      />
      <BluetoothPanel
        bleStatus={ble.status}
        deviceName={ble.deviceName ?? undefined}
        onConnect={ble.connect}
        onDisconnect={ble.disconnect}
        isDemo={demoMode}
        onToggleDemo={toggleDemo}
      />
    </div>
  );
}
