/**
 * React Hooks for Laser Device Management
 * 
 * Provides convenient hooks for:
 * - Querying device connection state
 * - Triggering measurements
 * - Handling continuous mode (walk-the-room)
 * - Battery monitoring
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  laserDeviceManager,
  AbstractLaserDevice,
  MeasurementReading,
  LaserDeviceStatus,
  LaserCapabilities,
} from "@/lib/LaserDeviceAbstraction";

/**
 * Hook: useLaserDevice
 * Subscribe to laser device connection state
 */
export function useLaserDevice() {
  const [device, setDevice] = useState<AbstractLaserDevice | null>(() =>
    laserDeviceManager.getConnectedDevice()
  );

  useEffect(() => {
    const unsubscribe = laserDeviceManager.subscribe((newDevice) => {
      setDevice(newDevice);
    });

    return unsubscribe;
  }, []);

  return device;
}

/**
 * Hook: useLaserDeviceStatus
 * Get current connection status
 */
export function useLaserDeviceStatus() {
  const device = useLaserDevice();
  const [status, setStatus] = useState<LaserDeviceStatus>("disconnected");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (device) {
      // Poll status (in future, could use event emitter)
      interval = setInterval(() => {
        setStatus(device.getStatus());
      }, 1000);
    } else {
      // Schedule state update after render to avoid cascading
      setTimeout(() => setStatus("disconnected"), 0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [device]);

  return status;
}

/**
 * Hook: useLaserMeasurement
 * Perform single measurements
 */
export function useLaserMeasurement() {
  const device = useLaserDevice();
  const [measurement, setMeasurement] = useState<MeasurementReading | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const measure = useCallback(async () => {
    if (!device) {
      setError(new Error("No laser device connected"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await device.measure();
      setMeasurement(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [device]);

  return { measurement, error, isLoading, measure };
}

/**
 * Hook: useLaserContinuous
 * For walk-the-room workflow
 * 
 * Usage:
 *   const { start, stop, measurements, error } = useLaserContinuous();
 *   
 *   <button onClick={start}>Start Walk</button>
 *   {measurements.map((m) => <MeasurementItem key={m.timestamp} {...m} />)}
 */
export interface UseLaserContinuousOptions {
  onMeasurement?: (reading: MeasurementReading) => void;
  onError?: (error: Error) => void;
}

export function useLaserContinuous(options?: UseLaserContinuousOptions) {
  const device = useLaserDevice();
  const [isActive, setIsActive] = useState(false);
  const [measurements, setMeasurements] = useState<MeasurementReading[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const start = useCallback(async () => {
    if (!device) {
      setError(new Error("No laser device connected"));
      return;
    }

    try {
      setIsActive(true);
      setError(null);
      setMeasurements([]);

      await device.startContinuous(
        (reading) => {
          setMeasurements((prev) => [...prev, reading]);
          options?.onMeasurement?.(reading);
        },
        (err) => {
          setError(err);
          options?.onError?.(err);
        }
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsActive(false);
      options?.onError?.(error);
    }
  }, [device, options]);

  const stop = useCallback(async () => {
    if (device && isActive) {
      try {
        await device.stopContinuous();
      } catch (err) {
        console.error("Error stopping continuous measurement", err);
      } finally {
        setIsActive(false);
      }
    }
  }, [device, isActive]);

  const reset = useCallback(() => {
    setMeasurements([]);
    setError(null);
  }, []);

  return { isActive, measurements, error, start, stop, reset };
}

/**
 * Hook: useLaserBattery
 * Monitor battery level
 */
export function useLaserBattery(pollInterval = 5000) {
  const device = useLaserDevice();
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!device) {
      // Schedule state update after render to avoid cascading
      setTimeout(() => setBatteryLevel(null), 0);
      return;
    }

    const poll = async () => {
      try {
        const level = await device.getBatteryLevel();
        setBatteryLevel(level);
      } catch (error) {
        console.error("Error reading battery", error);
      }
    };

    poll();
    const interval = setInterval(poll, pollInterval);

    return () => {
      clearInterval(interval);
    };
  }, [device, pollInterval]);

  return batteryLevel;
}

/**
 * Hook: useLaserCapabilities
 * Get device capabilities
 */
export function useLaserCapabilities(): LaserCapabilities | null {
  const device = useLaserDevice();
  return device ? device.getCapabilities() : null;
}

/**
 * Hook: useLaserConnection
 * Connect/disconnect from device
 */
export function useLaserConnection() {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async (deviceId: string) => {
    setConnecting(true);
    setError(null);

    try {
      await laserDeviceManager.connectDevice(deviceId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setConnecting(true);
    setError(null);

    try {
      await laserDeviceManager.disconnectDevice();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, []);

  const discover = useCallback(async () => {
    try {
      return await laserDeviceManager.discoverDevices();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  return { connect, disconnect, discover, connecting, error };
}
