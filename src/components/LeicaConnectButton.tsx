// LeicaConnectButton.tsx
// Button to connect to Leica DISTO via BLE and fetch last measurement

"use client";
import React, { useState } from "react";
import { LeicaBLEManager } from "@/lib/leica/LeicaBLEManager";

export default function LeicaConnectButton({ onMeasurement }: { onMeasurement: (distance: number) => void }) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    setConnecting(true);
    setError("");
    try {
      const mgr = new LeicaBLEManager();
      await mgr.connect();
      const dist = await mgr.getLastMeasurement();
      if (dist != null) onMeasurement(dist);
      else setError("No measurement found.");
      await mgr.disconnect();
    } catch (e: any) {
      setError(e.message || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="mb-2">
      <button onClick={handleConnect} className="px-4 py-2 bg-blue-700 text-white rounded" disabled={connecting}>
        {connecting ? "Connecting..." : "Connect Leica DISTO"}
      </button>
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </div>
  );
}
