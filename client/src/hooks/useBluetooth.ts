import { useEffect, useState, useRef, useCallback } from 'react';

const HR_SERVICE    = 0x180D;
const HR_CHAR       = 0x2A37;
const BATTERY_SVC   = 0x180F;
const BATTERY_CHAR  = 0x2A19;

export type BluetoothStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'unsupported' | 'error';

interface BluetoothLikeDevice extends EventTarget {
  id?: string;
  name?: string;
  gatt?: {
    connected?: boolean;
    connect: () => Promise<BluetoothLikeServer>;
    disconnect: () => void;
  };
}

interface BluetoothLikeServer {
  getPrimaryService: (service: number) => Promise<BluetoothLikeService>;
}

interface BluetoothLikeService {
  getCharacteristic: (characteristic: number) => Promise<BluetoothLikeCharacteristic>;
}

interface BluetoothLikeCharacteristic extends EventTarget {
  startNotifications: () => Promise<BluetoothLikeCharacteristic>;
  stopNotifications?: () => Promise<BluetoothLikeCharacteristic>;
  readValue?: () => Promise<DataView>;
}

function parseHeartRateValue(value: DataView | undefined) {
  if (!value || value.byteLength < 2) return null;
  const flags = value.getUint8(0);
  const is16Bit = Boolean(flags & 0x01);
  const heartRate = is16Bit && value.byteLength >= 3 ? value.getUint16(1, true) : value.getUint8(1);
  return heartRate >= 30 && heartRate <= 220 ? heartRate : null;
}

function bluetoothErrorMessage(err: unknown) {
  const name = (err as { name?: string })?.name;
  if (name === 'NotFoundError') return '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Bluetooth permission was blocked.';
  if (name === 'NotSupportedError') return 'This browser does not support Web Bluetooth.';
  if (name === 'NetworkError') return 'Watch disconnected before setup finished.';
  return 'Could not connect to this watch.';
}

/**
 * useBluetooth - Web Bluetooth hook for smart watches and BLE heart-rate bands.
 *
 * The device must expose the standard BLE Heart Rate service. Many watches do;
 * some proprietary watches only share biometrics through their native phone app.
 */
export function useBluetooth() {
  const [status, setStatus]             = useState<BluetoothStatus>('idle');
  const [heartRate, setHeartRate]       = useState<number | null>(null);
  const [deviceName, setDeviceName]     = useState<string | null>(null);
  const [deviceId, setDeviceId]         = useState<string | null>(null);
  const [battery, setBattery]           = useState<number | null>(null);
  const [lastReadingAt, setLastReadingAt] = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const deviceRef = useRef<BluetoothLikeDevice | null>(null);
  const charRef   = useRef<BluetoothLikeCharacteristic | null>(null);

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const parseHR = useCallback((event: Event) => {
    const value = (event.target as { value?: DataView })?.value;
    const hr = parseHeartRateValue(value);
    if (!hr) return;
    setHeartRate(hr);
    setLastReadingAt(new Date().toISOString());
  }, []);

  const handleDisconnected = useCallback(() => {
    charRef.current = null;
    setStatus('disconnected');
    setHeartRate(null);
    setBattery(null);
  }, []);

  const connectToDevice = useCallback(async (device: BluetoothLikeDevice) => {
    if (!device.gatt) throw new Error('This Bluetooth device does not expose GATT services.');

    if (deviceRef.current && deviceRef.current !== device) {
      try { deviceRef.current.removeEventListener('gattserverdisconnected', handleDisconnected); } catch {}
    }

    deviceRef.current = device;
    setDeviceName(device.name || 'Smart watch');
    setDeviceId(device.id || null);
    device.removeEventListener('gattserverdisconnected', handleDisconnected);
    device.addEventListener('gattserverdisconnected', handleDisconnected);

    const server = await device.gatt.connect();
    const hrSvc = await server.getPrimaryService(HR_SERVICE);
    const hrChar = await hrSvc.getCharacteristic(HR_CHAR);
    charRef.current = hrChar;
    hrChar.removeEventListener('characteristicvaluechanged', parseHR);
    hrChar.addEventListener('characteristicvaluechanged', parseHR);
    await hrChar.startNotifications();

    try {
      const firstReading = await hrChar.readValue?.();
      const hr = parseHeartRateValue(firstReading);
      if (hr) {
        setHeartRate(hr);
        setLastReadingAt(new Date().toISOString());
      }
    } catch {
      // Some watches only allow notifications, not direct reads.
    }

    try {
      const batSvc  = await server.getPrimaryService(BATTERY_SVC);
      const batChar = await batSvc.getCharacteristic(BATTERY_CHAR);
      const batVal  = await batChar.readValue?.();
      if (batVal) setBattery(batVal.getUint8(0));
    } catch {
      setBattery(null);
    }

    setStatus('connected');
  }, [handleDisconnected, parseHR]);

  const connect = useCallback(async () => {
    if (!isSupported) {
      setStatus('unsupported');
      setError('Bluetooth is not available in this browser.');
      return;
    }

    try {
      setStatus('connecting');
      setError(null);
      setHeartRate(null);

      const device = await (navigator as unknown as {
        bluetooth: {
          requestDevice: (options: {
            filters: Array<{ services: number[] }>;
            optionalServices: number[];
          }) => Promise<BluetoothLikeDevice>;
        };
      }).bluetooth.requestDevice({
        filters: [{ services: [HR_SERVICE] }],
        optionalServices: [BATTERY_SVC],
      });

      await connectToDevice(device);
    } catch (err: unknown) {
      const message = bluetoothErrorMessage(err);
      if (!message) {
        setStatus('idle');
        return;
      }
      console.error('[BLE]', err);
      setError(message);
      setStatus('error');
      setHeartRate(null);
    }
  }, [connectToDevice, isSupported]);

  const reconnect = useCallback(async () => {
    if (!deviceRef.current) return connect();
    try {
      setStatus('connecting');
      setError(null);
      await connectToDevice(deviceRef.current);
    } catch (err) {
      console.error('[BLE reconnect]', err);
      setError('Could not reconnect to the watch.');
      setStatus('error');
    }
  }, [connect, connectToDevice]);

  const disconnect = useCallback(async () => {
    if (charRef.current) {
      try { charRef.current.removeEventListener('characteristicvaluechanged', parseHR); } catch {}
      try { await charRef.current.stopNotifications?.(); } catch {}
      charRef.current = null;
    }
    if (deviceRef.current) {
      try { deviceRef.current.removeEventListener('gattserverdisconnected', handleDisconnected); } catch {}
    }
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    setStatus('disconnected');
    setHeartRate(null);
    setBattery(null);
  }, [handleDisconnected, parseHR]);

  useEffect(() => () => {
    void disconnect();
  }, [disconnect]);

  return {
    isSupported,
    status,
    heartRate,
    deviceName,
    deviceId,
    battery,
    lastReadingAt,
    error,
    connect,
    reconnect,
    disconnect,
  };
}
