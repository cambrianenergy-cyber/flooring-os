"use client";
import { getStoredViewMode, setStoredViewMode, ViewMode } from "@/lib/viewMode";
import { useEffect, useState } from "react";

export function FounderModeToggle({ isFounder }: { isFounder: boolean }) {
  const [mode, setMode] = useState<ViewMode>("user");

  useEffect(() => setMode(getStoredViewMode()), []);

  if (!isFounder) return null;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontWeight: 600 }}>View:</span>
      <button
        onClick={() => {
          const next: ViewMode = mode === "founder" ? "user" : "founder";
          setMode(next);
          setStoredViewMode(next);
          window.location.reload(); // simplest reliable reset; replace later with state-based re-render
        }}
      >
        {mode === "founder" ? "Founder View" : "User View"}
      </button>
    </div>
  );
}
