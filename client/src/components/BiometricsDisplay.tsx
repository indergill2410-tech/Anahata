import React from 'react';

interface BiometricsDisplayProps {
  biometrics: { heartRate?: number };
  musicParams?: { targetHeartRate?: number; musicalTempo?: number; desiredBrainwaveState?: string; binauralHz?: number; emotionalTone?: string };
}

function BiometricsDisplay({ biometrics, musicParams }: BiometricsDisplayProps) {
  const { heartRate } = biometrics;

  return (
    <div className="card">
      <h2>Live Biometrics</h2>
      <div className="pulse-ring">
        <div>
          <div className="bpm-display">{heartRate}</div>
          <div className="bpm-label">BPM</div>
        </div>
      </div>

      {musicParams && (
        <>
          <div className="metric">
            <span className="metric-label">Target Heart Rate</span>
            <span className="metric-value">{musicParams.targetHeartRate} BPM</span>
          </div>
          <div className="metric">
            <span className="metric-label">Musical Tempo</span>
            <span className="metric-value">{musicParams.musicalTempo} BPM</span>
          </div>
          <div className="metric">
            <span className="metric-label">Brainwave State</span>
            <span className="metric-value">
              <span className="brainwave-badge">{musicParams.desiredBrainwaveState}</span>
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Binaural Frequency</span>
            <span className="metric-value">{musicParams.binauralHz} Hz</span>
          </div>
          <div className="metric">
            <span className="metric-label">Emotional Tone</span>
            <span className="metric-value" style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
              {musicParams.emotionalTone}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default React.memo(BiometricsDisplay);
