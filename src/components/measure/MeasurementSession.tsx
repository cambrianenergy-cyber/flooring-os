/**
 * Measurement Session Component
 *
 * Manages active measurement sessions with laser device
 */

"use client";

import type { LeicaReading } from "@/lib/leicaBLE";
import { LeicaDistoDevice } from "@/lib/leicaBLE";
import type {
    MeasureDevice,
    MeasureReading,
    MeasureSession,
} from "@/types/measureSchema";
import { MEASURE_COLLECTIONS } from "@/types/measureSchema";
import {
    addDoc,
    collection,
    doc,
    DocumentChange,
    DocumentData,
    getDocs,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    QueryDocumentSnapshot,
    QuerySnapshot,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

interface MeasurementSessionProps {
  workspaceId: string;
  jobId: string;
  roomId?: string;
  userId: string;
  onSessionCreated?: (sessionId: string) => void;
  onReadingCaptured?: (reading: MeasureReading & { id: string }) => void;
}

type MeasureMode = "assisted_draw" | "walk_room" | "rect_by_size" | "manual";

export function MeasurementSession({
  workspaceId,
  jobId,
  roomId,
  userId,
  onSessionCreated,
  onReadingCaptured,
}: MeasurementSessionProps) {
  const [activeSession, setActiveSession] = useState<
    (MeasureSession & { id: string }) | null
  >(null);
  const [device, setDevice] = useState<(MeasureDevice & { id: string }) | null>(
    null,
  );
  const [mode, setMode] = useState<MeasureMode>("assisted_draw");
  const [readings, setReadings] = useState<(MeasureReading & { id: string })[]>(
    [],
  );
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leicaDevice, setLeicaDevice] = useState<LeicaDistoDevice | null>(null);

  const db = getFirestore();

  // Load active device
  const loadActiveDevice = useCallback(async () => {
    try {
      const devicesRef = collection(db, MEASURE_COLLECTIONS.DEVICES);
      const q = query(
        devicesRef,
        where("workspaceId", "==", workspaceId),
        where("status", "==", "active"),
        orderBy("lastSeenAt", "desc"),
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setDevice({
          id: docSnap.id,
          ...docSnap.data(),
        } as MeasureDevice & { id: string });
      }
    } catch (err) {
      console.error("Error loading device:", err);
    }
  }, [db, workspaceId]);

  // Connect to BLE device when device is loaded
  const connectToLeicaDevice = useCallback(async () => {
    if (!device) return;
    try {
      const leica = new LeicaDistoDevice();
      await leica.connect(device.ble?.deviceId);
      // Set unit to feet
      await leica.setUnit("ft");
      setLeicaDevice(leica);
      console.log("Connected to Leica Disto:", leica.getDeviceName());
    } catch (err) {
      console.error("Failed to connect to Leica device:", err);
      setError("Failed to connect to laser device. Please try pairing again.");
    }
  }, [device]);

  // Load active device
  useEffect(() => {
    loadActiveDevice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // Connect to BLE device when device is loaded
  useEffect(() => {
    if (device && !leicaDevice) {
      connectToLeicaDevice();
    }
    return () => {
      // Cleanup: disconnect on unmount
      if (leicaDevice) {
        leicaDevice.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, leicaDevice]);

  // Subscribe to readings when session is active
  useEffect(() => {
    if (!activeSession) return;

    const readingsRef = collection(db, MEASURE_COLLECTIONS.READINGS);
    const q = query(
      readingsRef,
      where("sessionId", "==", activeSession.id),
      orderBy("capturedAt", "asc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const newReadings = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data(),
          }),
        ) as (MeasureReading & { id: string })[];

        setReadings(newReadings);

        // Notify parent of new readings
        snapshot
          .docChanges()
          .forEach((change: DocumentChange<DocumentData>) => {
            if (change.type === "added") {
              const reading = {
                id: change.doc.id,
                ...change.doc.data(),
              } as MeasureReading & { id: string };
              onReadingCaptured?.(reading);
            }
          });
      },
    );

    return () => unsubscribe();
  }, [activeSession, db, onReadingCaptured]);

  async function startSession() {
    if (!device) {
      setError("No device connected. Please pair a device first.");
      return;
    }

    setError(null);

    try {
      const sessionsRef = collection(db, MEASURE_COLLECTIONS.SESSIONS);
      const sessionDoc = await addDoc(sessionsRef, {
        workspaceId,
        jobId,
        roomId: roomId || null,
        deviceId: device.id,
        startedBy: userId,
        mode,
        status: "active",
        app: {
          platform: "web",
          deviceModel: navigator.userAgent,
          appVersion: "1.0.0",
        },
        startedAt: Timestamp.now(),
        endedAt: undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
      } as Omit<MeasureSession, "id">);

      const newSession = {
        id: sessionDoc.id,
        workspaceId,
        jobId,
        roomId: roomId || null,
        deviceId: device.id,
        startedBy: userId,
        mode,
        status: "active" as const,
        app: {
          platform: "web" as const,
          deviceModel: navigator.userAgent,
          appVersion: "1.0.0",
        },
        startedAt: Timestamp.now(),
        endedAt: undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
      };

      setActiveSession(newSession);
      onSessionCreated?.(sessionDoc.id);
    } catch (err) {
      console.error("Error starting session:", err);
      setError(err instanceof Error ? err.message : "Failed to start session");
    }
  }

  async function captureReading() {
    if (!activeSession || !device) return;

    if (!leicaDevice || !leicaDevice.isConnected()) {
      setError("Laser device not connected. Please reconnect and try again.");
      return;
    }

    setCapturing(true);
    setError(null);

    try {
      // Trigger actual laser measurement
      const leicaReading: LeicaReading = await leicaDevice.measure();

      // Store reading in Firestore
      const readingsRef = collection(db, MEASURE_COLLECTIONS.READINGS);
      await addDoc(readingsRef, {
        workspaceId,
        jobId,
        roomId: roomId || null,
        sessionId: activeSession.id,
        deviceId: device.id,
        reading: {
          value: leicaReading.distance * 12, // Convert feet to inches
          unit: "in" as const,
          display: `${leicaReading.distance.toFixed(2)}'`,
          type: "single" as const,
          signalQuality: leicaReading.signalStrength || 100,
          tiltAngleDeg: leicaReading.tiltX || undefined,
        },
        capturedAt: Timestamp.now(),
        capturedBy: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
      } as Omit<MeasureReading, "id">);

      // Update session timestamp
      const sessionRef = doc(
        db,
        MEASURE_COLLECTIONS.SESSIONS,
        activeSession.id,
      );
      await updateDoc(sessionRef, {
        updatedAt: Timestamp.now(),
      });

      // Update device last seen
      const deviceRef = doc(db, MEASURE_COLLECTIONS.DEVICES, device.id);
      await updateDoc(deviceRef, {
        lastSeenAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error("Error capturing reading:", err);
      setError(
        err instanceof Error ? err.message : "Failed to capture reading",
      );
    } finally {
      setCapturing(false);
    }
  }

  async function endSession() {
    if (!activeSession) return;

    try {
      // Stop continuous mode if active
      if (leicaDevice && leicaDevice.isConnected()) {
        await leicaDevice.stopContinuous();
      }

      const sessionRef = doc(
        db,
        MEASURE_COLLECTIONS.SESSIONS,
        activeSession.id,
      );
      await updateDoc(sessionRef, {
        status: "ended",
        endedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      setActiveSession(null);
      setReadings([]);
    } catch (err) {
      console.error("Error ending session:", err);
      setError(err instanceof Error ? err.message : "Failed to end session");
    }
  }

  async function discardSession() {
    if (!activeSession) return;

    try {
      // Stop continuous mode if active
      if (leicaDevice && leicaDevice.isConnected()) {
        await leicaDevice.stopContinuous();
      }

      const sessionRef = doc(
        db,
        MEASURE_COLLECTIONS.SESSIONS,
        activeSession.id,
      );
      await updateDoc(sessionRef, {
        status: "discarded",
        endedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      setActiveSession(null);
      setReadings([]);
    } catch (err) {
      console.error("Error discarding session:", err);
      setError(
        err instanceof Error ? err.message : "Failed to discard session",
      );
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!activeSession ? (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Start Measurement Session
          </h3>

          {device ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Device:</strong> {device.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Measurement Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as MeasureMode)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="assisted_draw">
                    Assisted Drawing (Point-to-Point)
                  </option>
                  <option value="walk_room">Walk Room (Automatic)</option>
                  <option value="rect_by_size">Rectangle by Dimensions</option>
                  <option value="manual">Manual Entry</option>
                </select>
              </div>

              <button
                onClick={startSession}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Start Session
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <p>No device connected.</p>
              <p className="text-sm">Please pair a Leica Disto device first.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-green-500 rounded-lg p-4 bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Session Active
                </h3>
                <p className="text-sm text-green-700">
                  Mode:{" "}
                  {mode
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={endSession}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded font-medium hover:bg-green-700"
                >
                  Complete
                </button>
                <button
                  onClick={discardSession}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded font-medium hover:bg-red-700"
                >
                  Discard
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-900">
                {readings.length} readings
              </div>
              <button
                onClick={captureReading}
                disabled={capturing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {capturing ? "Capturing..." : "Capture Reading"}
              </button>
            </div>
          </div>

          {/* Readings List */}
          {readings.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Captured Readings
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {readings.map((reading, index) => (
                  <div
                    key={reading.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-muted">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {(reading.reading.value / 12).toFixed(2)} ft
                        </p>
                        <p className="text-xs text-muted">
                          {reading.capturedAt.toDate().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted">
                        Signal:{" "}
                        {reading.reading.signalQuality?.toFixed(0) || 100}%
                      </p>
                      {reading.reading.tiltAngleDeg !== undefined && (
                        <p className="text-xs text-muted">
                          Tilt: {reading.reading.tiltAngleDeg.toFixed(1)}°
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
