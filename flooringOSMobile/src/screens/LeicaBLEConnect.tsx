import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

const manager = new BleManager();

export default function LeicaBLEConnect() {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      manager.destroy();
    };
  }, []);

  const scanForDevices = () => {
    setDevices([]);
    setScanning(true);
    setError(null);
    manager.startDeviceScan(null, null, (err, device) => {
      if (err) {
        setError(err.message);
        setScanning(false);
        return;
      }
      if (device && device.name && device.name.toLowerCase().includes('disto')) {
        setDevices((prev) => {
          if (!prev.find((d) => d.id === device.id)) {
            return [...prev, device];
          }
          return prev;
        });
      }
    });
    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 10000); // scan for 10 seconds
  };

  const connectToDevice = async (device: Device) => {
    setError(null);
    try {
      const connected = await manager.connectToDevice(device.id);
      setConnectedDevice(connected);
      manager.stopDeviceScan();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Leica BLE Connect</Text>
      {connectedDevice ? (
        <View style={styles.connectedBox}>
          <Text style={styles.connectedText}>Connected to: {connectedDevice.name}</Text>
          <Button title="Disconnect" onPress={async () => {
            await manager.cancelDeviceConnection(connectedDevice.id);
            setConnectedDevice(null);
          }} />
        </View>
      ) : (
        <>
          <Button title={scanning ? "Scanning..." : "Scan for DISTO Devices"} onPress={scanForDevices} disabled={scanning} />
          {scanning && <ActivityIndicator style={{ margin: 16 }} />}
          {error && <Text style={styles.error}>{error}</Text>}
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.deviceBtn} onPress={() => connectToDevice(item)}>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceId}>{item.id}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  deviceBtn: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceId: {
    fontSize: 12,
    color: '#888',
  },
  connectedBox: {
    padding: 16,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  connectedText: {
    fontSize: 16,
    color: '#007aff',
    marginBottom: 12,
  },
  error: {
    color: '#d00',
    marginVertical: 8,
  },
});
