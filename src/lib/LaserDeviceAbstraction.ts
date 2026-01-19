/**
 * Device Abstraction Layer - Laser Measurement Devices
 * 
 * Design Principle: App talks to the abstraction, not directly to hardware.
 * This allows plugging in Leica, Bosch, Hilti, etc. without app changes.
 * 
 * Currently Supported:
 * - Leica Disto D810 / D3 BLE
 * 
 * Future Support:
 * - Bosch GLM series
 * - Hilti PD series
 * - Custom integrations
 */

/**
 * Core measurement data from any laser device
 */
export interface MeasurementReading {
  distance: number; // meters
  bearing?: number; // degrees (0-359), optional for some devices
  timestamp: number; // milliseconds
  signal: "good" | "fair" | "weak"; // signal quality
  accuracy?: number; // ±mm, device-specific
}

/**
 * Device status for UI feedback
 */
export type LaserDeviceStatus = 
  | "disconnected"
  | "connecting"
  | "connected"
  | "measuring"
  | "error"
  | "low_battery";

/**
 * Laser device capability set
 * Allows querying what the connected device can do
 */
export interface LaserCapabilities {
  supportsDistance: boolean; // Basic distance measurement
  supportsBearing: boolean; // Angle/heading measurement
  supportsContinuousMode: boolean; // Stream mode vs single shot
  supportsAreaCalculation: boolean; // Some devices compute area
  maxDistance: number; // meters
  minDistance: number; // meters
  accuracy: number; // ±mm
  batteryStatus: boolean; // Can report battery level
  signalQuality: boolean; // Can report signal strength
}

/**
 * Abstract laser device interface
 * Implementation-specific classes inherit from this
 */
export abstract class AbstractLaserDevice {
  abstract readonly name: string;
  abstract readonly model: string;
  abstract readonly deviceType: "leica" | "bosch" | "hilti" | "custom";
  
  protected status: LaserDeviceStatus = "disconnected";
  protected capabilities: LaserCapabilities;

  constructor(capabilities: LaserCapabilities) {
    this.capabilities = capabilities;
  }

  // =========================================================================
  // Connection Lifecycle
  // =========================================================================

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isConnected(): boolean;
  
  getStatus(): LaserDeviceStatus {
    return this.status;
  }

  getCapabilities(): LaserCapabilities {
    return this.capabilities;
  }

  // =========================================================================
  // Single Measurement
  // =========================================================================

  /**
   * Single distance measurement (shoot once)
   */
  abstract measure(): Promise<MeasurementReading>;

  /**
   * Measure with bearing (if supported)
   */
  abstract measureWithBearing(): Promise<MeasurementReading>;

  // =========================================================================
  // Continuous Mode (BLE stream)
  // =========================================================================

  /**
   * Start streaming measurements
   * For walk-the-room field workflow
   */
  abstract startContinuous(
    onMeasurement: (reading: MeasurementReading) => void,
    onError: (error: Error) => void
  ): Promise<void>;

  /**
   * Stop streaming
   */
  abstract stopContinuous(): Promise<void>;

  /**
   * Query if currently streaming
   */
  abstract isContinuousActive(): boolean;

  // =========================================================================
  // Device Info
  // =========================================================================

  abstract getBatteryLevel(): Promise<number | null>;
  abstract getFirmwareVersion(): Promise<string>;
  abstract getSerialNumber(): Promise<string>;

  // =========================================================================
  // Error Recovery
  // =========================================================================

  /**
   * Attempt to recover from error state
   * Typical: restart BLE connection, resync state
   */
  abstract recover(): Promise<void>;

  /**
   * Last known good measurement
   */
  protected lastReading: MeasurementReading | null = null;

  getLastReading(): MeasurementReading | null {
    return this.lastReading;
  }
}

/**
 * Laser Device Manager
 * 
 * Singleton that:
 * - Discovers available devices
 * - Maintains connected device
 * - Handles device switching
 * - Provides consistent interface to app
 */
export class LaserDeviceManager {
  private static instance: LaserDeviceManager;
  private connectedDevice: AbstractLaserDevice | null = null;
  private availableDevices: Map<string, AbstractLaserDevice> = new Map();
  private listeners: Set<(device: AbstractLaserDevice | null) => void> = new Set();

  private constructor() {}

  static getInstance(): LaserDeviceManager {
    if (!LaserDeviceManager.instance) {
      LaserDeviceManager.instance = new LaserDeviceManager();
    }
    return LaserDeviceManager.instance;
  }

  // =========================================================================
  // Device Discovery & Registration
  // =========================================================================

  /**
   * Register a laser device implementation
   * Called during app initialization for each supported device type
   */
  registerDevice(id: string, device: AbstractLaserDevice): void {
    this.availableDevices.set(id, device);
  }

  /**
   * Scan for nearby devices (BLE scan on iOS/Android)
   */
  async discoverDevices(): Promise<string[]> {
    // TODO: Trigger native BLE scan
    // Returns array of device IDs
    return Array.from(this.availableDevices.keys());
  }

  // =========================================================================
  // Connection Management
  // =========================================================================

  async connectDevice(deviceId: string): Promise<void> {
    const device = this.availableDevices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    if (this.connectedDevice) {
      await this.disconnectDevice();
    }

    await device.connect();
    this.connectedDevice = device;
    this.notifyListeners();
  }

  async disconnectDevice(): Promise<void> {
    if (this.connectedDevice) {
      await this.connectedDevice.disconnect();
      this.connectedDevice = null;
      this.notifyListeners();
    }
  }

  getConnectedDevice(): AbstractLaserDevice | null {
    return this.connectedDevice;
  }

  isConnected(): boolean {
    return this.connectedDevice !== null && this.connectedDevice.isConnected();
  }

  // =========================================================================
  // Measurement Convenience
  // =========================================================================

  async measure(): Promise<MeasurementReading> {
    if (!this.connectedDevice) {
      throw new Error("No laser device connected");
    }
    return this.connectedDevice.measure();
  }

  async measureWithBearing(): Promise<MeasurementReading> {
    if (!this.connectedDevice) {
      throw new Error("No laser device connected");
    }
    return this.connectedDevice.measureWithBearing();
  }

  // =========================================================================
  // Listeners (React hooks will subscribe)
  // =========================================================================

  subscribe(listener: (device: AbstractLaserDevice | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.connectedDevice));
  }
}

/**
 * Export singleton instance
 */
export const laserDeviceManager = LaserDeviceManager.getInstance();
