/**
 * Leica Disto D810 / D3 BLE Implementation
 * 
 * Concrete implementation of AbstractLaserDevice for Leica laser tape measures.
 * Handles BLE communication, parsing, and state management.
 * 
 * Supported Models:
 * - Disto D810 (professional, >400m, tilt sensor)
 * - Disto D3 (basic, ~60m, no tilt)
 * 
 * BLE Service UUIDs:
 * - 0xFFF0: Measurement Service
 * - 0xFFF1: Distance Characteristic (notify)
 * - 0xFFF2: Angle/Bearing Characteristic (notify)
 * - 0xFFF3: Control Characteristic (write)
 * - 0xFFF4: Battery Characteristic (read)
 */

import {
  AbstractLaserDevice,
  LaserCapabilities,
  MeasurementReading,
} from "@/lib/LaserDeviceAbstraction";

/**
 * Leica BLE device UUIDs
 */
const LEICA_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
const LEICA_DISTANCE_CHARACTERISTIC = "0000fff1-0000-1000-8000-00805f9b34fb";
const LEICA_BEARING_CHARACTERISTIC = "0000fff2-0000-1000-8000-00805f9b34fb";
const LEICA_CONTROL_CHARACTERISTIC = "0000fff3-0000-1000-8000-00805f9b34fb";
const LEICA_BATTERY_CHARACTERISTIC = "0000fff4-0000-1000-8000-00805f9b34fb";

/**
 * Leica command opcodes
 */
enum LeicaCommand {
  MEASURE_SINGLE = 0x00,
  MEASURE_CONTINUOUS_START = 0x01,
  MEASURE_CONTINUOUS_STOP = 0x02,
  GET_BATTERY = 0x03,
  GET_FIRMWARE = 0x04,
}

interface LeicaDeviceInfo {
  model: "D810" | "D3" | "unknown";
  firmwareVersion: string;
  serialNumber: string;
  batteryLevel: number; // 0-100
}

/**
 * Leica Disto D810 / D3 Implementation
 */
export class LeicaDistoDevice extends AbstractLaserDevice {
  readonly name = "Leica Disto";
  readonly model: string;
  readonly deviceType = "leica" as const;

  private bluetoothDevice: unknown = null; // Web Bluetooth API or native bridge
  private gattServer: unknown = null;
  private service: unknown = null;
  private distanceChar: unknown = null;
  private bearingChar: unknown = null;
  private controlChar: unknown = null;
  private batteryChar: unknown = null;

  private continuousActive = false;
  private deviceInfo: LeicaDeviceInfo | null = null;

  constructor(model: "D810" | "D3" = "D810") {
    const capabilities: LaserCapabilities = {
      supportsDistance: true,
      supportsBearing: model === "D810", // Only D810 has tilt
      supportsContinuousMode: true,
      supportsAreaCalculation: false,
      maxDistance: model === "D810" ? 400 : 60, // meters
      minDistance: 0.05, // meters
      accuracy: model === "D810" ? 1 : 2, // mm
      batteryStatus: true,
      signalQuality: true,
    };

    super(capabilities);
    this.model = model;
  }

  // =========================================================================
  // Connection
  // =========================================================================

  async connect(): Promise<void> {
    try {
      this.status = "connecting";

      // Request BLE device from user
      // In React Native, this would use native modules
      // In web, this uses Web Bluetooth API
      if (typeof (navigator as Navigator & { bluetooth?: { requestDevice?: () => Promise<unknown> } }).bluetooth?.requestDevice === "function") {
        this.bluetoothDevice = await (navigator as Navigator & { bluetooth?: { requestDevice?: () => Promise<unknown> } }).bluetooth!.requestDevice({
          filters: [{ services: [LEICA_SERVICE_UUID] }],
        });
      } else {
        throw new Error("BLE not supported on this device");
      }

      // Connect to GATT server
      if (!this.bluetoothDevice || typeof this.bluetoothDevice !== "object" || !('gatt' in this.bluetoothDevice)) {
        throw new Error("Invalid bluetoothDevice object");
      }
      const gattServer = (this.bluetoothDevice as { gatt: { connect: () => Promise<BluetoothRemoteGATTServer> } }).gatt;
      this.gattServer = await gattServer.connect();

      // Get service and characteristics
      if (!this.gattServer || typeof this.gattServer !== "object" || !('getPrimaryService' in this.gattServer)) {
        throw new Error("Invalid gattServer object");
      }
      const service = await (this.gattServer as BluetoothRemoteGATTServer).getPrimaryService(LEICA_SERVICE_UUID);
      this.service = service;
      this.distanceChar = await service.getCharacteristic(LEICA_DISTANCE_CHARACTERISTIC);
      this.bearingChar = await service.getCharacteristic(LEICA_BEARING_CHARACTERISTIC).catch(() => null);
      this.controlChar = await service.getCharacteristic(LEICA_CONTROL_CHARACTERISTIC).catch(() => null);
      this.batteryChar = await service.getCharacteristic(LEICA_BATTERY_CHARACTERISTIC).catch(() => null);

      // Enable notifications
      if (this.distanceChar && typeof this.distanceChar === "object" && 'startNotifications' in this.distanceChar && 'addEventListener' in this.distanceChar) {
        await (this.distanceChar as BluetoothRemoteGATTCharacteristic).startNotifications();
        (this.distanceChar as BluetoothRemoteGATTCharacteristic).addEventListener("characteristicvaluechanged", this.onDistanceNotification.bind(this));
      }

      if (this.bearingChar && this.capabilities.supportsBearing && typeof this.bearingChar === "object" && 'startNotifications' in this.bearingChar && 'addEventListener' in this.bearingChar) {
        await (this.bearingChar as BluetoothRemoteGATTCharacteristic).startNotifications();
        (this.bearingChar as BluetoothRemoteGATTCharacteristic).addEventListener("characteristicvaluechanged", this.onBearingNotification.bind(this));
      }

      this.status = "connected";

      // Fetch device info
      await this.fetchDeviceInfo();
    } catch (error) {
      this.status = "error";
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.continuousActive) {
      await this.stopContinuous();
    }

    if (
      this.bluetoothDevice &&
      typeof this.bluetoothDevice === "object" &&
      'gatt' in this.bluetoothDevice &&
      (this.bluetoothDevice as { gatt?: { connected?: boolean } }).gatt?.connected
    ) {
      (this.bluetoothDevice as { gatt: { disconnect: () => void } }).gatt.disconnect();
    }

    this.status = "disconnected";
  }

  isConnected(): boolean {
    if (
      this.status !== "connected" ||
      !this.bluetoothDevice ||
      typeof this.bluetoothDevice !== "object" ||
      !('gatt' in this.bluetoothDevice)
    ) {
      return false;
    }
    const gatt = (this.bluetoothDevice as { gatt?: { connected?: boolean } }).gatt;
    return gatt?.connected === true;
  }

  // =========================================================================
  // Measurement
  // =========================================================================

  async measure(): Promise<MeasurementReading> {
    if (!this.isConnected()) {
      throw new Error("Device not connected");
    }

    this.status = "measuring";

    try {
      // Send MEASURE_SINGLE command
      await this.sendCommand(LeicaCommand.MEASURE_SINGLE);

      // Wait for distance notification (with timeout)
      const reading = await this.waitForMeasurement(5000);
      this.lastReading = reading;

      this.status = "connected";
      return reading;
    } catch (error) {
      this.status = "error";
      throw error;
    }
  }

  async measureWithBearing(): Promise<MeasurementReading> {
    if (!this.capabilities.supportsBearing) {
      throw new Error("This device does not support bearing measurement");
    }

    return this.measure(); // D810 returns bearing in distance notification
  }

  // =========================================================================
  // Continuous Mode (Walk-the-room)
  // =========================================================================

  async startContinuous(
    onMeasurement: (reading: MeasurementReading) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Device not connected");
    }

    try {
      this.continuousActive = true;
      this.continuousMeasurementCallback = onMeasurement;
      this.continuousErrorCallback = onError;

      await this.sendCommand(LeicaCommand.MEASURE_CONTINUOUS_START);
      this.status = "measuring";
    } catch (error) {
      this.continuousActive = false;
      throw error;
    }
  }

  async stopContinuous(): Promise<void> {
    if (this.continuousActive) {
      try {
        await this.sendCommand(LeicaCommand.MEASURE_CONTINUOUS_STOP);
      } catch (error) {
        console.error("Error stopping continuous measurement", error);
      }

      this.continuousActive = false;
      this.status = "connected";
    }
  }

  isContinuousActive(): boolean {
    return this.continuousActive;
  }

  // =========================================================================
  // Device Info
  // =========================================================================

  async getBatteryLevel(): Promise<number | null> {
    if (!this.isConnected() || !this.batteryChar) {
      return null;
    }

    try {
      if (typeof this.batteryChar === "object" && 'readValue' in this.batteryChar) {
        const value = await (this.batteryChar as BluetoothRemoteGATTCharacteristic).readValue();
        const dv = new DataView(value.buffer);
        return dv.getUint8(0); // Battery percentage (0-100)
      }
      return null;
    } catch (error) {
      console.error("Error reading battery", error);
      return null;
    }
  }

  async getFirmwareVersion(): Promise<string> {
    if (this.deviceInfo) {
      return this.deviceInfo.firmwareVersion;
    }
    return "unknown";
  }

  async getSerialNumber(): Promise<string> {
    if (this.deviceInfo) {
      return this.deviceInfo.serialNumber;
    }
    return "unknown";
  }

  async recover(): Promise<void> {
    try {
      await this.disconnect();
      await this.connect();
    } catch (error) {
      this.status = "error";
      throw error;
    }
  }

  // =========================================================================
  // Private Helpers
  // =========================================================================

  private async fetchDeviceInfo(): Promise<void> {
    try {
      const battery = await this.getBatteryLevel();
      this.deviceInfo = {
        model: this.model as "D810" | "D3",
        firmwareVersion: "1.0", // TODO: read from device
        serialNumber: "SN-000000", // TODO: read from device
        batteryLevel: battery || 0,
      };
    } catch (error) {
      console.error("Error fetching device info", error);
    }
  }

  private async sendCommand(command: LeicaCommand): Promise<void> {
    if (!this.controlChar || typeof this.controlChar !== "object" || !('writeValue' in this.controlChar)) {
      throw new Error("Control characteristic not available");
    }

    const buffer = new Uint8Array([command]);
    await (this.controlChar as BluetoothRemoteGATTCharacteristic).writeValue(buffer);
  }

  private continuousMeasurementCallback: ((reading: MeasurementReading) => void) | null = null;
  private continuousErrorCallback: ((error: Error) => void) | null = null;
  private pendingMeasurement: MeasurementReading | null = null;
  private measurementResolver: ((reading: MeasurementReading) => void) | null = null;

  private onDistanceNotification(event: Event): void {
    try {
      const target = event.target as BluetoothRemoteGATTCharacteristic | null;
      if (!target || typeof target !== "object" || !('value' in target)) return;
      const value = (target as { value?: DataView }).value;
      if (!value) return;
      const distance = value.getFloat32(0, true) / 1000; // Convert mm to meters
      const signal = this.parseSignalQuality(value.getUint8(4));

      const reading: MeasurementReading = {
        distance,
        signal,
        timestamp: Date.now(),
      };

      this.lastReading = reading;
      if (this.continuousActive && this.continuousMeasurementCallback) {
        this.continuousMeasurementCallback(reading);
      } else if (this.measurementResolver) {
        this.measurementResolver(reading);
        this.measurementResolver = null;
      }
    } catch (error) {
      if (this.continuousErrorCallback) {
        this.continuousErrorCallback(error as Error);
      }
    }
  }

  private onBearingNotification(event: Event): void {
    try {
      const target = event.target as BluetoothRemoteGATTCharacteristic | null;
      if (!target || typeof target !== "object" || !('value' in target)) return;
      const value = (target as { value?: DataView }).value;
      if (!value) return;
      const bearing = value.getFloat32(0, true); // degrees

      if (this.lastReading) {
        this.lastReading.bearing = bearing;
      }
    } catch (error) {
      console.error("Error parsing bearing", error);
    }
  }

  private waitForMeasurement(timeout: number): Promise<MeasurementReading> {
    return new Promise((resolve, reject) => {
      this.measurementResolver = resolve;
      setTimeout(() => {
        this.measurementResolver = null;
        reject(new Error("Measurement timeout"));
      }, timeout);
    });
  }

  private parseSignalQuality(rawValue: number): "good" | "fair" | "weak" {
    if (rawValue > 80) return "good";
    if (rawValue > 50) return "fair";
    return "weak";
  }
}

/**
 * Export factory function for easier instantiation
 */
export function createLeicaDistoDevice(model: "D810" | "D3" = "D810"): LeicaDistoDevice {
  return new LeicaDistoDevice(model);
}
