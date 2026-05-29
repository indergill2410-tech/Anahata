const { analyzeBiometrics, hrvBinauralOffset, selectBinauralTone } = require('../utils/biometricAnalyzer');

describe('analyzeBiometrics', () => {
  test('maps high HR to Beta state', () => {
    const r = analyzeBiometrics(85);
    expect(r.brainwaveState).toBe('Beta');
    expect(r.stressLevel).toBe('elevated');
  });

  test('maps resting HR to Theta state', () => {
    const r = analyzeBiometrics(62);
    expect(r.brainwaveState).toBe('Theta');
    expect(r.stressLevel).toBe('calm');
  });

  test('maps very low HR to Delta state', () => {
    const r = analyzeBiometrics(48);
    expect(r.brainwaveState).toBe('Delta');
  });

  test('maps Alpha HR correctly', () => {
    const r = analyzeBiometrics(73);
    expect(r.brainwaveState).toBe('Alpha');
  });

  test('throws on invalid HR', () => {
    expect(() => analyzeBiometrics(0)).toThrow();
    expect(() => analyzeBiometrics(null)).toThrow();
    expect(() => analyzeBiometrics(250)).toThrow();
  });

  test('targetHeartRate is <= input HR when HR > 68', () => {
    const r = analyzeBiometrics(80);
    expect(r.targetHeartRate).toBeLessThanOrEqual(80);
  });

  test('musicalTempo is slower than HR', () => {
    const r = analyzeBiometrics(75);
    expect(r.musicalTempo).toBeLessThan(75);
  });
});

describe('hrvBinauralOffset', () => {
  test('returns negative offset for low HRV', () => {
    expect(hrvBinauralOffset(15)).toBe(-1.5);
  });
  test('returns 0 for moderate HRV', () => {
    expect(hrvBinauralOffset(35)).toBe(0);
  });
  test('returns positive offset for high HRV', () => {
    expect(hrvBinauralOffset(70)).toBe(1);
  });
});

describe('selectBinauralTone', () => {
  test('returns positive Hz value', () => {
    expect(selectBinauralTone('Theta', 40)).toBeGreaterThan(0);
  });
  test('stays at minimum 0.5 Hz', () => {
    expect(selectBinauralTone('Delta', 5)).toBeGreaterThanOrEqual(0.5);
  });
});
