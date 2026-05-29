import { useState, useRef, useCallback } from 'react';

const HR_SERVICE    = 0x180D;
const HR_CHAR       = 0x2A37;
const BATTERY_SVC   = 0x180F;
const BATTERY_CHAR  = 0x2A19;

/**
 * useBluetooth — Web Bluetooth API hook for heart rate monitors
 */
export function useBluetooth() {
  const [status, setStatus]           = useState('idle');     // idle | connecting | connected | disconnected | unsupported | error
  const [heartRate, setHeartRate]     = useState(null);
  const [deviceName, setDeviceName]   = useState(null);
  const [battery, setBattery]         = useState(null);
  const deviceRef = useRef(null);
  const charRef   = useRef(null);

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const parseHR = useCallback((event) => {
    const value = event.target.value;
    const flags = value.getUint8(0);
    const hr = flags & 0x01 ? value.getUint16(1, true) : value.getUint8(1);
    setHeartRate(hr);
  }, []);

  const connect = useCallback(async () => {
    if (!isSupported) { setStatus('unsupported'); return; }
    try {
      setStatus('connecting');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HR_SERVICE] }],
        optionalServices: [BATTERY_SVC]
      });
      deviceRef.current = device;
      setDeviceName(device.name || 'Unknown Device');

      device.addEventListener('gattserverdisconnected', () => setStatus('disconnected'));

      const server  = await device.gatt.connect();
      const hrSvc   = await server.getPrimaryService(HR_SERVICE);
      const hrChar  = await hrSvc.getCharacteristic(HR_CHAR);
      charRef.current = hrChar;
      await hrChar.startNotifications();
      hrChar.addEventListener('characteristicvaluechanged', parseHR);

      // Battery (optional)
      try {
        const batSvc  = await server.getPrimaryService(BATTERY_SVC);
        const batChar = await batSvc.getCharacteristic(BATTERY_CHAR);
        const batVal  = await batChar.readValue();
        setBattery(batVal.getUint8(0));
      } catch {}

      setStatus('connected');
    } catch (err) {
      if (err.name === 'NotFoundError') { setStatus('idle'); return; }
      console.error('[BLE]', err);
      setStatus('error');
    }
  }, [isSupported, parseHR]);

  const disconnect = useCallback(async () => {
    if (charRef.current) {
      try { charRef.current.removeEventListener('characteristicvaluechanged', parseHR); } catch {}
    }
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    setStatus('disconnected');
    setHeartRate(null);
  }, [parseHR]);

  return { isSupported, status, heartRate, deviceName, battery, connect, disconnect };
}
