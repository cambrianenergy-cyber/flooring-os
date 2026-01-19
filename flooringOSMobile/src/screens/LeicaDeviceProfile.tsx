import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const supportedModels = [
  { name: 'D1', smartRoom: false, p2p: false },
  { name: 'D110', smartRoom: false, p2p: false },
  { name: 'D2', smartRoom: false, p2p: false },
  { name: 'D2-2', smartRoom: true, p2p: false },
  { name: 'D2G', smartRoom: true, p2p: false },
  { name: 'D5', smartRoom: true, p2p: false },
  { name: 'D510', smartRoom: false, p2p: false },
  { name: 'D810', smartRoom: false, p2p: false },
  { name: 'S910', smartRoom: false, p2p: true },
  { name: 'X1', smartRoom: false, p2p: false },
  { name: 'X3', smartRoom: true, p2p: true },
  { name: 'X4', smartRoom: true, p2p: true },
  { name: 'X6', smartRoom: true, p2p: true },
];

export default function LeicaDeviceProfile() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Leica DISTO Device Profiles</Text>
      <FlatList
        data={supportedModels}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.deviceBtn, selected === item.name && styles.selectedBtn]}
            onPress={() => setSelected(item.name)}
          >
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.feature}>{item.smartRoom ? 'Smart Room' : ''}</Text>
            <Text style={styles.feature}>{item.p2p ? 'P2P' : ''}</Text>
          </TouchableOpacity>
        )}
      />
      {selected && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Selected: {selected}</Text>
          <Text style={styles.infoText}>
            Features: {supportedModels.find(m => m.name === selected)?.smartRoom ? 'Smart Room ' : ''}
            {supportedModels.find(m => m.name === selected)?.p2p ? 'P2P' : ''}
          </Text>
        </View>
      )}
      <Button title="Continue" onPress={() => {}} />
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
  selectedBtn: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  feature: {
    fontSize: 14,
    color: '#555',
  },
  infoBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#007aff',
  },
});
