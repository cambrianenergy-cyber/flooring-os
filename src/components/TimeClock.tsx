"use client";
import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface TimeClockProps {
  userId: string;
  onClockEvent?: () => void;
}

export default function TimeClock({ userId, onClockEvent }: TimeClockProps) {
  const [clockedIn, setClockedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClockIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, "timeClock"), {
        userId,
        type: "in",
        timestamp: new Date().toISOString(),
      });
      setClockedIn(true);
      setLoading(false);
      if (onClockEvent) onClockEvent();
      window.dispatchEvent(new CustomEvent("toast", { detail: { type: "success", message: "Clocked in!" } }));
    } catch (e: any) {
      setLoading(false);
      setError(e.message || "Failed to clock in.");
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, "timeClock"), {
        userId,
        type: "out",
        timestamp: new Date().toISOString(),
      });
      setClockedIn(false);
      setLoading(false);
      if (onClockEvent) onClockEvent();
      window.dispatchEvent(new CustomEvent("toast", { detail: { type: "success", message: "Clocked out!" } }));
    } catch (e: any) {
      setLoading(false);
      setError(e.message || "Failed to clock out.");
    }
  };

  return (
    <div className="max-w-xs mx-auto p-4 border rounded bg-white mt-8">
      <h2 className="text-lg font-semibold mb-2">Time Clock</h2>
      <div className="mb-2">
        {clockedIn ? (
          <button onClick={handleClockOut} className="bg-red-600 text-white px-4 py-2 rounded" disabled={loading}>
            Clock Out
          </button>
        ) : (
          <button onClick={handleClockIn} className="bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>
            Clock In
          </button>
        )}
      </div>
      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
    </div>
  );
}
