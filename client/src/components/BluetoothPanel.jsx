import React, { useState, useRef } from 'react';

// Web Bluetooth Heart Rate Service UUID (standard BLE spec)
const HEART_RATE_SERVICE = 'heart_rate';
const HEART_RATE_CHARACTERISTIC = 'heart_rate_measurement';

export default function BluetoothPanel({ onBiometrics, wsStatus }) {
  const [bleStatus, setBleStatus] = useState('disconnected');
  const [deviceName, setDeviceName] = useState(null);
  const characteristicRef = useRef(null);

  function parseHeartRate(value) {
    // BLE Heart Rate Measurement parsing (per Bluetooth spec)
    const flags = value.getUint8(0);
    const is16bit = flags & 0x1;
    return is16bit ? value.getUint16(1, true) : value.getUint8(1);
  }

  async function connectBluetooth() {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth is not supported in this browser. Please use Chrome on desktop or Android.');
      return;
    }

    try {
      setBleStatus('searching');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE] }],
        optionalServices: ['battery_service', 'device_information']
      });

      setDeviceName(device.name || 'Unknown Device');
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(HEART_RATE_SERVICE);
      const characteristic = await service.getCharacteristic(HEART_RATE_CHARACTERISTIC);
      characteristicRef.current = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const heartRate = parseHeartRate(event.target.value);
        onBiometrics({ heartRate });
      });

      setBleStatus('connected');

      device.addEventListener('gattserverdisconnected', () => {
        setBleStatus('disconnected');
        setDeviceName(null);
      });

    } catch (err) {
      console.error('[BLE]', err);
      setBleStatus('disconnected');
      if (err.name !== 'NotFoundError') {
        alert(`Bluetooth error: ${err.message}`);
      }
    }
  }

  async function disconnectBluetooth() {
    try {
      if (characteristicRef.current) {
        await characteristicRef.current.stopNotifications();
      }
    } catch {}
    setBleStatus('disconnected');
    setDeviceName(null);
  }

  const statusLabel = {
    disconnected: 'Connect Smartwatch',
    searching: 'Searching...',
    connected: `Connected — ${deviceName}`
  }[bleStatus];

  return (
    <div className="card">
      <h2>Smartwatch</h2>
      <div style={{ marginBottom: '16px', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>
        <span className={`status-dot ${bleStatus}`} />
        {statusLabel}
        <span style={{ marginLeft: '16px' }}>
          <span className={`status-dot ${wsStatus}`} />
          Server: {wsStatus}
        </span>
      </div>

      {bleStatus !== 'connected' ? (
        <button className="btn btn-primary" onClick={connectBluetooth} disabled={bleStatus === 'searching'}>
          {bleStatus === 'searching' ? 'Searching for device...' : '🔵 Connect via Bluetooth'}
        </button>
      ) : (
        <button className="btn btn-secondary" onClick={disconnectBluetooth}>
          Disconnect
        </button>
      )}
    </div>
  );
}
