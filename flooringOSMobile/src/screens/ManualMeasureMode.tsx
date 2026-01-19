import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const roomShapes = [
  { label: 'Rectangle', value: 'rectangle' },
  { label: 'L-Shape', value: 'lshape' },
  { label: 'Custom', value: 'custom' },
];

const wasteOptions = [5, 10, 12, 15];

export default function ManualMeasureMode() {
  const [shape, setShape] = useState('rectangle');
  const [distances, setDistances] = useState([""]);
  const [waste, setWaste] = useState(10);
  const [stairs, setStairs] = useState(false);
  const [transitions, setTransitions] = useState(0);

  const handleDistanceChange = (idx: number, value: string) => {
    const arr = [...distances];
    arr[idx] = value;
    setDistances(arr);
  };

  const addEdge = () => setDistances([...distances, ""]);

  const removeEdge = (idx: number) => {
    if (distances.length > 1) {
      setDistances(distances.filter((_, i) => i !== idx));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Manual Measure Mode</Text>
      <Text style={styles.label}>Room Shape</Text>
      <View style={styles.dropdownRow}>
        {roomShapes.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.dropdownBtn, shape === s.value && styles.selectedBtn]}
            onPress={() => setShape(s.value)}
          >
            <Text style={shape === s.value ? styles.selectedText : styles.dropdownText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Distances (ft)</Text>
      {distances.map((d, idx) => (
        <View key={idx} style={styles.inputRow}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={d}
            onChangeText={(v) => handleDistanceChange(idx, v)}
            placeholder={`Wall ${idx + 1}`}
          />
          {distances.length > 1 && (
            <TouchableOpacity onPress={() => removeEdge(idx)}>
              <Text style={styles.removeBtn}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      {shape === 'custom' && (
        <Button title="Add Wall" onPress={addEdge} />
      )}
      <Text style={styles.label}>Waste (%)</Text>
      <View style={styles.dropdownRow}>
        {wasteOptions.map((w) => (
          <TouchableOpacity
            key={w}
            style={[styles.dropdownBtn, waste === w && styles.selectedBtn]}
            onPress={() => setWaste(w)}
          >
            <Text style={waste === w ? styles.selectedText : styles.dropdownText}>{w}%</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.label}>Stairs</Text>
        <TouchableOpacity
          style={[styles.toggleBtn, stairs && styles.selectedBtn]}
          onPress={() => setStairs(!stairs)}
        >
          <Text style={stairs ? styles.selectedText : styles.dropdownText}>{stairs ? 'Yes' : 'No'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputRow}>
        <Text style={styles.label}>Transitions/Trim (ft)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={transitions.toString()}
          onChangeText={(v) => setTransitions(Number(v) || 0)}
        />
      </View>
      <Button title="Send to Estimate" onPress={() => {}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  dropdownRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  dropdownBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedBtn: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  dropdownText: {
    color: '#333',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 8,
    flex: 1,
    marginRight: 8,
    backgroundColor: '#fafafa',
  },
  removeBtn: {
    color: '#d00',
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleBtn: {
    marginLeft: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
});
