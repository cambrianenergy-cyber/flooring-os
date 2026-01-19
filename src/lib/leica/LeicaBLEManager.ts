// LeicaBLEManager.ts
// Handles BLE connection, pairing, and measurement streaming for Leica DISTO

export class LeicaBLEManager {
  device: BluetoothDevice | null = null;
  server: BluetoothRemoteGATTServer | null = null;
  onDisconnect?: () => void;

  async connect(): Promise<void> {
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "DISTO" }],
      optionalServices: ["battery_service", "blood_pressure"], // Battery, custom
    });
    (this.device as any).addEventListener("gattserverdisconnected", this.handleDisconnect);
    this.server = await this.device.gatt?.connect() || null;
  }

  handleDisconnect = () => {
    this.server = null;
    if (this.onDisconnect) this.onDisconnect();
  };

  async disconnect() {
    if (this.device) {
      (this.device as any).removeEventListener("gattserverdisconnected", this.handleDisconnect);
      if (this.device.gatt?.connected) {
        await this.device.gatt.disconnect();
      }
      this.device = null;
      this.server = null;
    }
  }

  // Example: fetch last measurement (to be implemented per model spec)
  async getLastMeasurement(): Promise<number | null> {
    // TODO: Implement characteristic read for distance
    return null;
  }
}
