"use client";
import { useState } from "react";

export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-label="Info"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#60a5fa",
          fontSize: "1.1em",
          marginLeft: 4,
          verticalAlign: "middle"
        }}
      >
        ℹ️
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: 28,
            background: "#22292f",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: 6,
            padding: "8px 12px",
            zIndex: 100,
            minWidth: 180,
            fontSize: 13,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}
        >
          {text}
          <button
            style={{
              background: "none",
              border: "none",
              color: "#aaa",
              float: "right",
              fontSize: 13,
              marginLeft: 8,
              cursor: "pointer"
            }}
            aria-label="Close info"
            onClick={e => { e.stopPropagation(); setOpen(false); }}
          >
            ×
          </button>
        </div>
      )}
    </span>
  );
}
