// Enhanced photo-anchored measurement: overlay markers, attach to room, edit/delete, responsive layout
"use client";
import React, { useRef, useState } from "react";

export interface PhotoMeasurementData {
  roomId: string;
  photoUrl: string;
  measurements: { label: string; value: number; x: number; y: number }[];
  notes: string;
}

export default function PhotoMeasurement({
  roomId,
  onChange,
}: {
  roomId: string;
  onChange: (data: PhotoMeasurementData) => void;
}) {
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [measurements, setMeasurements] = useState<PhotoMeasurementData["measurements"]>([]);
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState<{ x: number; y: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoUrl(ev.target?.result as string);
      setMeasurements([]);
      onChange({ roomId, photoUrl: ev.target?.result as string, measurements: [], notes });
    };
    reader.readAsDataURL(file);
  }

  function handlePhotoClick(e: React.MouseEvent<HTMLImageElement, MouseEvent>) {
    if (!photoUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setAdding({ x, y });
  }

  function addMeasurement(label: string, value: number) {
    if (!adding) return;
    const newMeasurements = [
      ...measurements,
      { label, value, x: adding.x, y: adding.y },
    ];
    setMeasurements(newMeasurements);
    setAdding(null);
    onChange({ roomId, photoUrl, measurements: newMeasurements, notes });
  }

  function deleteMeasurement(idx: number) {
    const newMeasurements = measurements.filter((_, i) => i !== idx);
    setMeasurements(newMeasurements);
    onChange({ roomId, photoUrl, measurements: newMeasurements, notes });
  }

  function handleNotesChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNotes(e.target.value);
    onChange({ roomId, photoUrl, measurements, notes: e.target.value });
  }

  return (
    <div className="border rounded p-4 mt-4 max-w-lg mx-auto">
      <h3 className="font-medium mb-2 text-lg">Photo Measurement</h3>
      <input
        type="file"
        accept="image/*"
        ref={fileInput}
        onChange={handlePhotoUpload}
        className="mb-2"
      />
      {photoUrl && (
        <div className="relative mb-2 w-full max-w-md mx-auto">
          <img
            src={photoUrl}
            alt="Room"
            className="rounded shadow w-full h-auto cursor-crosshair"
            onClick={handlePhotoClick}
            style={{ maxHeight: 320, objectFit: "contain" }}
          />
          {measurements.map((m, i) => (
            <div
              key={i}
              className="absolute z-10 flex flex-col items-center"
              style={{ left: m.x - 10, top: m.y - 30 }}
            >
              <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">
                {m.label}: {m.value} ft
              </div>
              <button
                className="text-xs text-red-600 mt-1"
                onClick={() => deleteMeasurement(i)}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
          {adding && (
            <div
              className="absolute z-20 flex flex-col items-center"
              style={{ left: adding.x - 10, top: adding.y - 30 }}
            >
              <input
                type="text"
                placeholder="Label"
                className="border rounded px-1 py-0.5 text-xs mb-1"
                id="add-label"
              />
              <input
                type="number"
                placeholder="Value (ft)"
                className="border rounded px-1 py-0.5 text-xs mb-1"
                id="add-value"
              />
              <button
                className="px-2 py-0.5 bg-green-600 text-white text-xs rounded"
                onClick={() => {
                  const label = (document.getElementById("add-label") as HTMLInputElement)?.value;
                  const value = Number((document.getElementById("add-value") as HTMLInputElement)?.value);
                  if (label && !isNaN(value)) {
                    addMeasurement(label, value);
                  }
                }}
              >
                Add
              </button>
              <button
                className="text-xs text-gray-500 mt-1"
                onClick={() => setAdding(null)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
      <div className="mb-2">
        <label className="block mb-1 font-medium">Notes</label>
        <textarea
          className="border rounded px-2 py-1 w-full"
          value={notes}
          onChange={handleNotesChange}
        />
      </div>
      <ul className="mb-2">
        {measurements.map((m, i) => (
          <li key={i} className="text-sm text-gray-700">
            {m.label}: {m.value} ft
          </li>
        ))}
      </ul>
    </div>
  );
}
