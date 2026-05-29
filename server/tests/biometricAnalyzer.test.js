const { analyzeMetrics } = require('../services/biometricAnalyzer');

describe('analyzeMetrics', () => {
  test('high HR (>100) maps to Alpha state', () => {
    const result = analyzeMetrics({ heartRate: 110 });
    expect(result.desiredBrainwaveState).toBe('Alpha');
    expect(result.binauralHz).toBe(10);
    expect(result.targetHeartRate).toBe(75);
  });

  test('mid HR (81-100) maps to Theta state', () => {
    const result = analyzeMetrics({ heartRate: 85 });
    expect(result.desiredBrainwaveState).toBe('Theta');
    expect(result.binauralHz).toBe(6);
  });

  test('low HR (<=65) maps to Delta state', () => {
    const result = analyzeMetrics({ heartRate: 60 });
    expect(result.desiredBrainwaveState).toBe('Delta');
    expect(result.binauralHz).toBe(2);
  });

  test('binaural channels are correctly offset', () => {
    const result = analyzeMetrics({ heartRate: 85 });
    expect(result.rightEarHz - result.leftEarHz).toBe(result.binauralHz);
  });

  test('HRV tone: above 60ms returns uplifting tone', () => {
    const result = analyzeMetrics({ heartRate: 70, hrv: 65 });
    expect(result.emotionalTone).toContain('uplifting');
  });

  test('HRV tone: below 40ms returns deeply soothing tone', () => {
    const result = analyzeMetrics({ heartRate: 70, hrv: 30 });
    expect(result.emotionalTone).toContain('deeply soothing');
  });

  test('musicalTempo never drops below 50', () => {
    const result = analyzeMetrics({ heartRate: 40 });
    expect(result.musicalTempo).toBeGreaterThanOrEqual(50);
  });
});
