// RoomListWithPhotoMeasurement.tsx
// Room list with Photo Measurement button for each room

"use client";
import React, { useState } from "react";
import DistoFloorPlanEditor from "./DistoFloorPlanEditor";
import { useCadUpload } from "@/lib/useCadUpload";
import { saveMeasurement } from "@/lib/useFirestoreMeasurement";
import PhotoMeasurement from "./PhotoMeasurement";
// import RoleGuard from "./RoleGuard";
import { logAuditEvent } from "@/lib/useAuditTrail";
import { auth } from "@/lib/firebase";

export default function RoomListWithPhotoMeasurement({ rooms }: { rooms: { id: string; name: string }[] }) {
    const { uploadCadFile, uploading: cadUploading, error: cadUploadError, downloadUrl: cadDownloadUrl } = useCadUpload();
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [showMeasurement, setShowMeasurement] = useState(false);
  const [showCadUpload, setShowCadUpload] = useState(false);
  const [showCreateCad, setShowCreateCad] = useState(false);
  const [measurementSaved, setMeasurementSaved] = useState(false);
  const [cadSaved, setCadSaved] = useState(false);
  const [cadError, setCadError] = useState<string | null>(null);
  const [cadModalError, setCadModalError] = useState<string | null>(null);
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [cadStatus, setCadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Select a Room</h2>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
        <select
          className="border rounded px-2 py-1 min-w-[180px]"
          value={selectedRoomId}
          onChange={e => {
            setSelectedRoomId(e.target.value);
            setShowMeasurement(false);
            setShowCadUpload(false);
            setShowCreateCad(false);
          }}
        >
          <option value="">-- Choose Room --</option>
          {rooms.map(room => (
            <option key={room.id} value={room.id}>{room.name}</option>
          ))}
        </select>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50 cursor-pointer"
          disabled={!selectedRoomId}
          onClick={() => setShowMeasurement(true)}
        >
          Photo Measurement
        </button>
        <button
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 cursor-pointer"
          disabled={!selectedRoomId}
          onClick={() => setShowCadUpload(true)}
        >
          Upload CAD Drawing
        </button>
        <button
          className="px-3 py-1 bg-green-700 text-white rounded disabled:opacity-50 cursor-pointer"
          disabled={!selectedRoomId}
          onClick={() => setShowCreateCad(true)}
        >
          Create CAD (Disto)
        </button>
        <button
          className="px-3 py-1 bg-green-700 text-white rounded disabled:opacity-50"
          disabled={!selectedRoomId}
          onClick={() => setShowCreateCad(true)}
        >
          Create CAD (Disto)
        </button>
      </div>
      {/* CAD Upload Modal */}
      {showCadUpload && selectedRoomId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 min-w-[320px] relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowCadUpload(false)}>&times;</button>
            <h3 className="text-md font-semibold mb-2">Upload CAD Drawing for Room</h3>
            <label htmlFor="cad-upload-input" className="block text-sm font-medium mb-1">Upload CAD file</label>
            <input
              id="cad-upload-input"
              type="file"
              accept=".dwg,.dxf,.pdf,.svg,.png,.jpg"
              onChange={e => setCadFile(e.target.files?.[0] || null)}
              className="mb-2"
            />
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50 cursor-pointer"
              disabled={!cadFile || cadUploading}
              onClick={async () => {
                if (!cadFile) return;
                setCadStatus("uploading");
                setCadModalError(null);
                try {
                  const url = await uploadCadFile(cadFile, selectedRoomId);
                  await saveMeasurement(selectedRoomId, {
                    cadUrl: url,
                    fileName: cadFile.name,
                  });
                  const userId = auth.currentUser?.uid || "unknown";
                  await logAuditEvent({
                    userId,
                    action: "upload-cad-drawing",
                    entityType: "room",
                    entityId: selectedRoomId,
                    data: { fileName: cadFile.name, downloadUrl: url },
                  });
                  setCadStatus("success");
                  setCadSaved(true);
                  setTimeout(() => {
                    setCadStatus("idle");
                    setShowCadUpload(false);
                    setCadFile(null);
                    setCadSaved(false);
                  }, 1200);
                } catch (e: any) {
                  setCadStatus("error");
                  setCadModalError(e.message || "Failed to upload");
                }
              }}
            >
              Upload
            </button>
            {cadUploading && <div className="text-blue-600 text-xs mt-2">Uploading...</div>}
            {cadDownloadUrl && cadStatus === "success" && (
              <div className="text-green-600 text-xs mt-2">Uploaded! <a href={cadDownloadUrl} target="_blank" rel="noopener noreferrer" className="underline">View CAD</a></div>
            )}
            {cadUploadError && <div className="text-red-600 text-xs mt-2">{cadUploadError}</div>}
            {cadModalError && <div className="text-red-600 text-xs mt-2">{cadModalError}</div>}
            {cadStatus === "error" && <div className="text-red-600 text-xs mt-2">Failed to upload</div>}
            {cadSaved && <div className="text-green-600 text-xs mt-2">CAD saved!</div>}
          </div>
        </div>
      )}
      {/* Create CAD Modal (Disto) */}
      {showCreateCad && selectedRoomId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 min-w-[420px] relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowCreateCad(false)}>&times;</button>
            <h3 className="text-md font-semibold mb-2">Create CAD Drawing with Disto</h3>
            <DistoFloorPlanEditor
              roomId={selectedRoomId}
              onSave={async (data) => {
                try {
                  await saveMeasurement(selectedRoomId, data);
                  const userId = auth.currentUser?.uid || "unknown";
                  await logAuditEvent({
                    userId,
                    action: "save-disto-cad",
                    entityType: "room",
                    entityId: selectedRoomId,
                    data,
                  });
                  setShowCreateCad(false);
                } catch (e: any) {
                  setCadError(e.message || "Failed to save CAD");
                }
              }}
            />
            {cadError && <div className="text-red-600 text-xs mt-2">{cadError}</div>}
          </div>
        </div>
      )}
      {/* ...existing code for PhotoMeasurement... */}
      {showMeasurement && selectedRoomId && (
        <div className="mb-4">
          <PhotoMeasurement
            roomId={selectedRoomId}
            onChange={async data => {
              setStatus("saving");
              setError(null);
              try {
                await saveMeasurement(selectedRoomId, data);
                const userId = auth.currentUser?.uid || "unknown";
                await logAuditEvent({
                  userId,
                  action: "save-photo-measurement",
                  entityType: "room",
                  entityId: selectedRoomId,
                  data,
                });
                setStatus("success");
                setMeasurementSaved(true);
                setTimeout(() => {
                  setStatus("idle");
                  setShowMeasurement(false);
                  setMeasurementSaved(false);
                }, 1200);
              } catch (e: any) {
                setError(e.message || "Failed to save");
                setStatus("error");
              }
            }}
          />
          {status === "saving" && <div className="text-blue-600 text-xs mt-1">Saving...</div>}
          {status === "success" && <div className="text-green-600 text-xs mt-1">Saved!</div>}
          {status === "error" && <div className="text-red-600 text-xs mt-1">{error}</div>}
          {measurementSaved && <div className="text-green-600 text-xs mt-1">Measurement saved!</div>}
        </div>
      )}
    </div>
  );
}
