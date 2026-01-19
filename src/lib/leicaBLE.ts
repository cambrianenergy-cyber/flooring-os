/**
 * Leica Disto BLE Communication Library
 * 
 * Handles low-level Bluetooth communication with Leica laser devices
 */

// Leica Disto BLE Service UUIDs
export const LEICA_SERVICES = {
  DISTANCE: "3ab10100-f831-4395-b29d-570977d5bf94",
  DATA: "00001523-1212-efde-1523-785feabcd123",
};

// Leica Disto BLE Characteristic UUIDs
export const LEICA_CHARACTERISTICS = {
  DISTANCE_VALUE: "3ab10101-f831-4395-b29d-570977d5bf94",
  DISTANCE_UNIT: "3ab10102-f831-4395-b29d-570977d5bf94",
  COMMAND: "3ab10103-f831-4395-b29d-570977d5bf94",
  TILT_X: "3ab10104-f831-4395-b29d-570977d5bf94",
  TILT_Y: "3ab10105-f831-4395-b29d-570977d5bf94",
};

// Leica Commands
export const LEICA_COMMANDS = {
  MEASURE: new Uint8Array([0x01]), // Trigger single measurement
  CLEAR: new Uint8Array([0x02]), // Clear last measurement
  CONTINUOUS_START: new Uint8Array([0x03]), // Start continuous measurement
  CONTINUOUS_STOP: new Uint8Array([0x04]), // Stop continuous measurement
};

export interface LeicaReading {
  distance: number;
  unit: "m" | "ft" | "in";
  timestamp: number;
  tiltX?: number;
  tiltY?: number;
  signalStrength?: number;
}

export class LeicaDistoDevice {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private distanceCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private unitCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private tiltXCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private tiltYCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onReadingCallback: ((reading: LeicaReading) => void) | null = null;

  async connect(deviceId?: string): Promise<boolean> {
    try {
      // Request device
      if (deviceId) {
        // Reconnect to known device
        const devices = await navigator.bluetooth.getDevices();
        this.device = devices.find(d => d.id === deviceId) || null;
        if (!this.device) {
          throw new Error("Device not found");
        }
      } else {
        // Discover new device
        this.device = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: "DISTO" },
            { namePrefix: "Leica" },
          ],
          optionalServices: [
            LEICA_SERVICES.DISTANCE,
            LEICA_SERVICES.DATA,
          ],
        });
      }

      // Add disconnect handler (gate for TS/lib compat)
      if (
        this.device &&
        "addEventListener" in this.device &&
        typeof this.device.addEventListener === "function"
      ) {
        this.device.addEventListener("gattserverdisconnected", () => {
          console.log("Leica device disconnected");
        });
      }

      // Connect to GATT server
      console.log('Connecting to GATT server...');
      this.server = await this.device.gatt?.connect() || null;
      if (!this.server) {
        throw new Error("Failed to connect to GATT server");
      }

      console.log('GATT connected, discovering services...');
      
      // Get distance service
      const distanceService = await this.server.getPrimaryService(LEICA_SERVICES.DISTANCE);
      console.log('Distance service found');

      // Get characteristics with better error handling
      console.log('Reading characteristics...');
      
      try {
        this.distanceCharacteristic = await distanceService.getCharacteristic(
          LEICA_CHARACTERISTICS.DISTANCE_VALUE
        );
        console.log('Distance characteristic found');
      } catch {
        throw new Error("Distance characteristic not found. This device may not be supported.");
      }

      // Get characteristics
      this.distanceCharacteristic = await distanceService.getCharacteristic(
        LEICA_CHARACTERISTICS.DISTANCE_VALUE
      );
      
      // Try to get unit characteristic (may not exist on all models)
      try {
        this.unitCharacteristic = await distanceService.getCharacteristic(
          LEICA_CHARACTERISTICS.DISTANCE_UNIT
        );
        console.log('Unit characteristic found');
      } catch {
        console.log("Unit characteristic not available");
      }
      
      // Try to get command characteristic (may not exist on all models)
      try {
        this.commandCharacteristic = await distanceService.getCharacteristic(
          LEICA_CHARACTERISTICS.COMMAND
        );
        console.log('Command characteristic found');
      } catch {
        console.log("Command characteristic not available - will use passive mode");
      }

      // Try to get tilt characteristics (may not exist on all models)
      try {
        this.tiltXCharacteristic = await distanceService.getCharacteristic(
          LEICA_CHARACTERISTICS.TILT_X
        );
        this.tiltYCharacteristic = await distanceService.getCharacteristic(
          LEICA_CHARACTERISTICS.TILT_Y
        );
        console.log('Tilt characteristics found');
      } catch {
        console.log("Tilt characteristics not available");
      }

      // Subscribe to distance notifications
      console.log('Starting distance notifications...');
      try {
        await this.distanceCharacteristic.startNotifications();
        this.distanceCharacteristic.addEventListener(
          "characteristicvaluechanged",
          this.handleDistanceChange.bind(this)
        );
        console.log('Distance notifications started successfully');
      } catch (err) {
        console.error('Failed to start notifications:', err);
        throw new Error(`Failed to enable notifications: ${(err as Error).message}. Your device may require pairing in system Bluetooth settings first.`);
      }

      console.log("Leica Disto connected successfully");
      return true;
    } catch (err) {
      console.error("Failed to connect to Leica Disto:", err);
      throw new Error((err as Error).message || "Failed to connect to device");
    }
  }

  async disconnect(): Promise<void> {
    if (this.distanceCharacteristic) {
      await this.distanceCharacteristic.stopNotifications();
      this.distanceCharacteristic.removeEventListener(
        "characteristicvaluechanged",
        this.handleDistanceChange.bind(this)
      );
    }

    if (this.server?.connected) {
      this.server.disconnect();
    }

    this.device = null;
    this.server = null;
    this.distanceCharacteristic = null;
    this.unitCharacteristic = null;
    this.commandCharacteristic = null;
    this.tiltXCharacteristic = null;
    this.tiltYCharacteristic = null;
  }

  private async handleDistanceChange(event: Event): Promise<void> {
    const characteristic = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (!value) return;

    // Parse distance value (Leica uses 4-byte float, little-endian)
    const dataView = new DataView(value.buffer);
    const distanceMeters = dataView.getFloat32(0, true);

    // Get current unit
    const unit = await this.getUnit();

    // Convert to requested unit
    let distance = distanceMeters;
    if (unit === "ft") {
      distance = distanceMeters * 3.28084;
    } else if (unit === "in") {
      distance = distanceMeters * 39.3701;
    }

    // Get tilt values if available
    let tiltX: number | undefined;
    let tiltY: number | undefined;
    if (this.tiltXCharacteristic && this.tiltYCharacteristic) {
      const tiltXValue = await this.tiltXCharacteristic.readValue();
      const tiltYValue = await this.tiltYCharacteristic.readValue();
      tiltX = new DataView(tiltXValue.buffer).getFloat32(0, true);
      tiltY = new DataView(tiltYValue.buffer).getFloat32(0, true);
    }

    // Get signal strength from RSSI (if available)
    let signalStrength: number | undefined;
    try {
      // This is non-standard but some browsers support it
      const device = this.device as { rssi?: number };
      const rssi = device?.rssi;
      if (typeof rssi === "number") {
        // Convert RSSI (-100 to -40 dBm) to percentage (0-100%)
        signalStrength = Math.max(0, Math.min(100, ((rssi + 100) / 60) * 100));
      }
    } catch {
      // RSSI not available
    }

    const reading: LeicaReading = {
      distance,
      unit,
      timestamp: Date.now(),
      tiltX,
      tiltY,
      signalStrength,
    };

    // Notify callback
    if (this.onReadingCallback) {
      this.onReadingCallback(reading);
    }
  }

  private async getUnit(): Promise<"m" | "ft" | "in"> {
    if (!this.unitCharacteristic) return "m";

    try {
      const value = await this.unitCharacteristic.readValue();
      const unitCode = value.getUint8(0);
      // Leica unit codes: 0 = meters, 1 = feet, 2 = inches
      switch (unitCode) {
        case 1:
          return "ft";
        case 2:
          return "in";
        default:
          return "m";
      }
    } catch {
      return "m";
    }
  }

  async setUnit(unit: "m" | "ft" | "in"): Promise<void> {
    if (!this.unitCharacteristic) {
      throw new Error("Unit characteristic not available");
    }

    const unitCode = unit === "ft" ? 1 : unit === "in" ? 2 : 0;
    await this.unitCharacteristic.writeValue(new Uint8Array([unitCode]));
  }

  async measure(): Promise<LeicaReading> {
    if (!this.commandCharacteristic) {
      throw new Error("Command characteristic not available. Your device may only support passive reading.");
    }

    return new Promise((resolve, reject) => {
      // Set up one-time callback
      const timeout = setTimeout(() => {
        this.onReadingCallback = null;
        reject(new Error("Measurement timeout"));
      }, 10000); // 10 second timeout

      this.onReadingCallback = (reading) => {
        clearTimeout(timeout);
        this.onReadingCallback = null;
        resolve(reading);
      };

      // Send measure command
      this.commandCharacteristic!.writeValue(LEICA_COMMANDS.MEASURE).catch((err: Error) => {
        clearTimeout(timeout);
        this.onReadingCallback = null;
        reject(err);
      });
    });
  }

  async startContinuous(callback: (reading: LeicaReading) => void): Promise<void> {
    // Set callback for continuous readings
    this.onReadingCallback = callback;
    
    // Try to send continuous start command if available
    if (this.commandCharacteristic) {
      try {
        await this.commandCharacteristic.writeValue(LEICA_COMMANDS.CONTINUOUS_START);
      } catch (err) {
        console.log("Continuous mode command failed, will use passive notifications:", err);
      }
    } else {
      console.log("No command characteristic, using passive notification mode");
    }
  }

  async stopContinuous(): Promise<void> {
    this.onReadingCallback = null;
    
    if (this.commandCharacteristic) {
      try {
        await this.commandCharacteristic.writeValue(LEICA_COMMANDS.CONTINUOUS_STOP);
      } catch (err) {
        console.log("Stop continuous command failed:", err);
      }
    }
  }

  async clearLastMeasurement(): Promise<void> {
    if (!this.commandCharacteristic) {
      throw new Error("Command characteristic not available");
    }

    await this.commandCharacteristic.writeValue(LEICA_COMMANDS.CLEAR);
  }

  isConnected(): boolean {
    return this.server?.connected || false;
  }

  getDeviceName(): string {
    return this.device?.name || "Unknown";
  }

  getDeviceId(): string {
    return this.device?.id || "";
  }
}
