/**
 * Leica Disto Device Pairing Component
 * 
 * Handles BLE connection to Leica laser devices
 */

"use client";

import React, { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { MEASURE_COLLECTIONS } from "@/types/measureSchema";
import type { MeasureDevice } from "@/types/measureSchema";

interface LeicaDevicePairingProps {
  workspaceId: string;
  userId: string;
  onDevicePaired?: (deviceId: string) => void;
}

interface BLEDevice {
  id: string;
  name: string;
  rssi?: number;
}

export function LeicaDevicePairing({
  workspaceId,
  userId,
  onDevicePaired,
}: LeicaDevicePairingProps) {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [pairedDevices, setPairedDevices] = useState<(MeasureDevice & { id: string })[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const db = getFirestore();

  const loadPairedDevices = React.useCallback(async () => {
    try {
      const devicesRef = collection(db, MEASURE_COLLECTIONS.DEVICES);
      const q = query(
        devicesRef,
        where("workspaceId", "==", workspaceId),
        where("status", "==", "active")
      );
      const snapshot = await getDocs(q);
      const devices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (MeasureDevice & { id: string })[];
      setPairedDevices(devices);
    } catch (err) {
      console.error("Error loading paired devices:", err);
    }
  }, [db, workspaceId]);

  // Load paired devices
  useEffect(() => {
    loadPairedDevices();
  }, [workspaceId, loadPairedDevices]);

  async function scanForDevices() {
    setScanning(true);
    setError(null);
    setDevices([]);

    try {
      // Check if Web Bluetooth is available
      if (!navigator.bluetooth) {
        throw new Error("Web Bluetooth not supported in this browser");
      }

      // Request Bluetooth device
      // Leica Disto uses custom service UUIDs
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: "DISTO" },
          { namePrefix: "Leica" },
        ],
        optionalServices: [
          "3ab10100-f831-4395-b29d-570977d5bf94", // Leica Distance Service
          "00001523-1212-efde-1523-785feabcd123", // Leica Data Service
        ]
      });

      if (device.id && device.name) {
        setDevices([{
          id: device.id,
          name: device.name,
        }]);
      }
    } catch (err) {
      console.error("Bluetooth scan error:", err);
      setError(err instanceof Error ? err.message : "Failed to scan for devices");
    } finally {
      setScanning(false);
    }
  }

  async function connectDevice(device: BLEDevice) {
    setConnecting(device.id);
    setError(null);

    try {
      // Request device again to get GATT server
      const bleDevice = await navigator.bluetooth.requestDevice({
        filters: [{ name: device.name }],
        optionalServices: [
          "3ab10100-f831-4395-b29d-570977d5bf94",
          "00001523-1212-efde-1523-785feabcd123",
        ]
      });

      const server = await bleDevice.gatt?.connect();
      if (!server) throw new Error("Failed to connect to GATT server");

      // Get services and characteristics
      const services = await server.getPrimaryServices();
      const serviceUuids = services.map((s: { uuid: string }) => s.uuid);
      
      const characteristics = await Promise.all(
        services.map((s: { getCharacteristics: () => Promise<unknown[]> }) => s.getCharacteristics())
      );
      const characteristicUuids = (characteristics.flat() as Array<{ uuid: string }>).map((c) => c.uuid);

      // Save device to Firestore
      const devicesRef = collection(db, MEASURE_COLLECTIONS.DEVICES);
      const deviceDoc = await addDoc(devicesRef, {
        workspaceId,
        name: device.name,
        brand: "leica",
        model: device.name.toLowerCase().includes("x4") ? "disto_x4" : "disto_unknown",
        protocol: "ble",
        ble: {
          deviceId: device.id,
          serviceUuids,
          characteristicUuids,
        },
        capabilities: {
          singleShot: true,
          continuous: true,
          tiltAngle: device.name.toLowerCase().includes("x4"),
          areaOnDevice: false,
        },
        status: "active",
        lastSeenAt: Timestamp.now(),
        pairedBy: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
      } as Omit<MeasureDevice, "id">);

      // Reload paired devices
      await loadPairedDevices();
      
      // Callback
      onDevicePaired?.(deviceDoc.id);

      // Clear scan results
      setDevices([]);
    } catch (err) {
      console.error("Device connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect device");
    } finally {
      setConnecting(null);
    }
  }

  async function removeDevice(deviceId: string) {
    try {
      const deviceRef = doc(db, MEASURE_COLLECTIONS.DEVICES, deviceId);
      await updateDoc(deviceRef, {
        status: "disabled",
        updatedAt: Timestamp.now(),
      });
      
      await loadPairedDevices();
    } catch (err) {
      console.error("Error removing device:", err);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Laser Devices</h3>
        <button
          onClick={scanForDevices}
          disabled={scanning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {scanning ? "Scanning..." : "Pair New Device"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Scan Results */}
      {devices.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Found Devices</h4>
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-sm text-gray-500">{device.id.slice(0, 20)}...</p>
                </div>
                <button
                  onClick={() => connectDevice(device)}
                  disabled={connecting === device.id}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {connecting === device.id ? "Connecting..." : "Connect"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paired Devices */}
      {pairedDevices.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Paired Devices</h4>
          <div className="space-y-2">
            {pairedDevices.map((device: MeasureDevice & { id: string }) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div>
                  <p className="font-medium text-green-900">{device.name}</p>
                  <p className="text-sm text-green-700">
                    {device.model} · {device.capabilities.tiltAngle ? "Tilt" : "Basic"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last seen: {device.lastSeenAt.toDate().toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => removeDevice(device.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded font-medium hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pairedDevices.length === 0 && devices.length === 0 && !scanning && (
        <div className="text-center py-8 text-gray-500">
          <p>No devices paired yet.</p>
          <p className="text-sm">Click &quot;Pair New Device&quot; to connect a Leica Disto.</p>
        </div>
      )}
    </div>
  );
}
