import { useState, useRef, useCallback } from 'react';

const HR_SERVICE = 'heart_rate';
const HR_CHAR    = 'heart_rate_measurement';

function parseHR(dataView) {
  const flags = dataView.getUint8(0);
  return (flags & 0x1) ? dataView.getUint16(1, true) : dataView.getUint8(1);
}

export function useBluetooth(onHeartRate) {
  const [status, setStatus] = useState('disconnected'); // disconnected | searching | connected
  const [deviceName, setDeviceName] = useState(null);
  const [error, setError] = useState(null);
  const charRef = useRef(null);
  const deviceRef = useRef(null);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      setError('Web Bluetooth is not supported. Use Chrome on Android or desktop.');
      return;
    }
    setError(null);
    setStatus('searching');
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HR_SERVICE] }],
        optionalServices: ['battery_service']
      });
      deviceRef.current = device;
      setDeviceName(device.name || 'Watch');

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(HR_SERVICE);
      const char = await service.getCharacteristic(HR_CHAR);
      charRef.current = char;

      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', (e) => {
        onHeartRate(parseHR(e.target.value));
      });
      setStatus('connected');

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('disconnected');
        setDeviceName(null);
      });
    } catch (err) {
      setStatus('disconnected');
      if (err.name !== 'NotFoundError') setError(err.message);
    }
  }, [onHeartRate]);

  const disconnect = useCallback(async () => {
    try { await charRef.current?.stopNotifications(); } catch {}
    try { deviceRef.current?.gatt?.disconnect(); } catch {}
    setStatus('disconnected');
    setDeviceName(null);
  }, []);

  return { status, deviceName, error, connect, disconnect };
}
