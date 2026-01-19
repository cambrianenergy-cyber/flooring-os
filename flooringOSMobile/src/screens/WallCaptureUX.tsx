
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import type { Device } from 'react-native-ble-plx';
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

// Helper to calculate area for rectangle, L-shape, or custom
function calculateArea(walls: { value: string; measurement?: string }[]): number {
  // Rectangle: use first two walls
  if (walls.length === 2 && walls[0].measurement && walls[1].measurement) {
    return parseFloat(walls[0].measurement) * parseFloat(walls[1].measurement);
  }
  // L-shape or custom: sum of triangles (placeholder, real implementation needed)
  if (walls.length > 2 && walls.every(w => w.measurement)) {
    // For demo, just sum all wall lengths as a proxy
    return walls.reduce((sum, w) => sum + parseFloat(w.measurement!), 0);
  }
  return 0;
}

export default function WallCaptureUX({ navigation }: any) {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [walls, setWalls] = useState<{ label: string; value: string; measurement?: string }[]>([
    { label: 'Wall A', value: 'A' },
    { label: 'Wall B', value: 'B' },
  ]);
  const [selectedWall, setSelectedWall] = useState<string | null>(null);
  const [fetching, setFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<number | null>(null);

  const scanAndConnect = async (): Promise<void> => {
    setError(null);
    setFetching(true);
    manager.startDeviceScan(null, null, async (err: Error | null, device: Device | null) => {
      if (err) {
        setError(err.message);
        setFetching(false);
        return;
      }
      if (device && device.name && device.name.toLowerCase().includes('disto')) {
        manager.stopDeviceScan();
        try {
          const connected = await manager.connectToDevice(device.id);
          setConnectedDevice(connected);
        } catch (e: any) {
          setError(e.message);
        }
        setFetching(false);
      }
    });
    setTimeout(() => {
      manager.stopDeviceScan();
      setFetching(false);
    }, 10000);
  };

  const fetchMeasurement = async (): Promise<void> => {
    if (!connectedDevice || !selectedWall) return;
    setFetching(true);
    setError(null);
    setTimeout(() => {
      // Simulate BLE fetch
      const value = (Math.random() * 20 + 5).toFixed(2); // random 5-25 ft
      setWalls((prev: { label: string; value: string; measurement?: string }[]) =>
        prev.map((w: { label: string; value: string; measurement?: string }) =>
          w.value === selectedWall ? { ...w, measurement: value } : w
        )
      );
      setFetching(false);
      Alert.alert('Measurement Captured', `Wall ${selectedWall}: ${value} ft`);
    }, 1500);
  };

  const addWall = (): void => {
    const next = String.fromCharCode(65 + walls.length); // A, B, C, ...
    setWalls([...walls, { label: `Wall ${next}`, value: next }]);
  };

  const removeWall = (value: string): void => {
    if (walls.length > 2) {
      setWalls(walls.filter((w: { label: string; value: string; measurement?: string }) => w.value !== value));
    }
  };

  const handleEstimate = (): void => {
    const area = calculateArea(walls);
    setEstimate(area);
    Alert.alert('Estimate', `Estimated Area: ${area.toFixed(2)} sqft`);
    // Here you could push this to a global estimate context or navigate
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Wall Capture</Text>
      {connectedDevice ? (
        <Text style={styles.connectedText}>Connected: {connectedDevice.name}</Text>
      ) : (
        <Button title={fetching ? 'Scanning...' : 'Connect to DISTO'} onPress={scanAndConnect} disabled={fetching} />
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={walls}
        keyExtractor={(item) => item.value}
        renderItem={({ item }: { item: { label: string; value: string; measurement?: string } }) => (
          <TouchableOpacity
            style={[styles.wallBtn, selectedWall === item.value && styles.selectedBtn]}
            onPress={() => setSelectedWall(item.value)}
            disabled={!connectedDevice}
          >
            <Text style={styles.wallLabel}>{item.label}</Text>
            <Text style={styles.measurement}>{item.measurement ? `${item.measurement} ft` : '—'}</Text>
            {walls.length > 2 && (
              <Button title="Remove" onPress={() => removeWall(item.value)} />
            )}
          </TouchableOpacity>
        )}
      />
      <Button
        title={fetching ? 'Fetching...' : 'Fetch Measurement'}
        onPress={fetchMeasurement}
        disabled={!connectedDevice || !selectedWall || fetching}
      />
      <Button title="Add Wall" onPress={addWall} disabled={walls.length >= 8} />
      <Button title="Estimate Area" onPress={handleEstimate} disabled={!walls.every(w => w.measurement)} />
      {estimate !== null && (
        <Text style={styles.estimateText}>Estimated Area: {estimate.toFixed(2)} sqft</Text>
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
  connectedText: {
    fontSize: 16,
    color: '#007aff',
    marginBottom: 12,
  },
  wallBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  selectedBtn: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  wallLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  measurement: {
    fontSize: 16,
    color: '#555',
  },
  error: {
    color: '#d00',
    marginVertical: 8,
  },
  estimateText: {
    fontSize: 18,
    color: '#007aff',
    marginTop: 16,
    fontWeight: 'bold',
  },
});
