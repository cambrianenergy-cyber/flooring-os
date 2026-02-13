/**
 * Photo Capture Component
 *
 * Camera integration with Firebase Storage upload
 */

"use client";

import type { GeometrySegment, MeasurePhoto } from "@/types/measureSchema";
import { MEASURE_COLLECTIONS } from "@/types/measureSchema";
import {
    addDoc,
    collection,
    getFirestore,
    Timestamp,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

interface PhotoCaptureProps {
  workspaceId: string;
  jobId: string;
  roomId: string;
  segments: GeometrySegment[];
  userId: string;
  onPhotoAdded?: (photo: MeasurePhoto & { id: string }) => void;
}

export function PhotoCapture({
  workspaceId,
  jobId,
  roomId,
  segments,
  userId,
  onPhotoAdded,
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<(MeasurePhoto & { id: string })[]>([]);
  const [uploading, setUploading] = useState(false);
  const [captureMode, setCaptureMode] = useState<"upload" | "camera">("upload");
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    let isMounted = true;

    const fetchMissingUrls = async () => {
      const missing = photos.filter((photo) => !photoUrls[photo.id]);
      if (missing.length === 0) return;

      const fetched = await Promise.all(
        missing.map(async (photo) => {
          const url = await getDownloadURL(ref(storage, photo.storagePath));
          return [photo.id, url] as const;
        }),
      );

      if (!isMounted) return;
      setPhotoUrls((prev) => {
        const next = { ...prev };
        fetched.forEach(([id, url]) => {
          next[id] = url;
        });
        return next;
      });
    };

    fetchMissingUrls();
    return () => {
      isMounted = false;
    };
  }, [photos, photoUrls, storage]);

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1920, height: 1080 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setStream(mediaStream);
      setCaptureMode("camera");
    } catch (err) {
      console.error("Failed to start camera:", err);
      alert("Failed to access camera. Please check permissions.");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
      async (blob) => {
        if (blob) {
          await uploadPhoto(blob);
        }
      },
      "image/jpeg",
      0.9,
    );
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await uploadPhoto(files[i]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadPhoto(file: Blob) {
    setUploading(true);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `measurements/${workspaceId}/${jobId}/${roomId}/${timestamp}.jpg`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, file);

      // Get download URL
      const url = await getDownloadURL(storageRef);

      // Save metadata to Firestore
      const photosRef = collection(db, MEASURE_COLLECTIONS.PHOTOS);
      const photoDoc = await addDoc(photosRef, {
        workspaceId,
        jobId,
        roomId,
        storagePath: filename,
        caption: notes || undefined,
        linkedTo: selectedSegment
          ? {
              segmentId: selectedSegment,
            }
          : undefined,
        takenAt: Timestamp.now(),
        takenBy: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
      } as Omit<MeasurePhoto, "id">);

      const newPhoto: MeasurePhoto & { id: string } = {
        id: photoDoc.id,
        workspaceId,
        jobId,
        roomId,
        storagePath: filename,
        caption: notes || undefined,
        linkedTo: selectedSegment
          ? {
              segmentId: selectedSegment,
            }
          : undefined,
        takenAt: Timestamp.now(),
        takenBy: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
      };

      setPhotos([...photos, newPhoto]);
      setPhotoUrls((prev) => ({ ...prev, [newPhoto.id]: url }));
      onPhotoAdded?.(newPhoto);

      // Reset form
      setNotes("");
      setSelectedSegment(null);

      // Stop camera after capture
      if (captureMode === "camera") {
        stopCamera();
        setCaptureMode("upload");
      }
    } catch (err) {
      console.error("Failed to upload photo:", err);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-border rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-4">Photos</h4>

      {/* Capture Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            stopCamera();
            setCaptureMode("upload");
          }}
          className={`flex-1 px-4 py-2 rounded-lg font-medium ${
            captureMode === "upload"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          📁 Upload
        </button>
        <button
          onClick={startCamera}
          className={`flex-1 px-4 py-2 rounded-lg font-medium ${
            captureMode === "camera"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          📷 Camera
        </button>
      </div>

      {/* Camera View */}
      {captureMode === "camera" && (
        <div className="mb-4">
          <video
            ref={videoRef}
            className="w-full rounded-lg bg-primary"
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />
          <button
            onClick={capturePhoto}
            disabled={uploading || !stream}
            className="w-full mt-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "📸 Capture Photo"}
          </button>
        </div>
      )}

      {/* Upload Form */}
      {captureMode === "upload" && (
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Choose Photos"}
          </button>
        </div>
      )}

      {/* Photo Options */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link to Wall (Optional)
          </label>
          <select
            value={selectedSegment || ""}
            onChange={(e) => setSelectedSegment(e.target.value || null)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="">No specific wall</option>
            {segments.map((segment) => (
              <option key={segment.id} value={segment.id}>
                {segment.id} ({(segment.length / 12).toFixed(1)}&#39;)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this photo..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            rows={2}
          />
        </div>
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted">
            {photos.length} {photos.length === 1 ? "photo" : "photos"} captured
          </p>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo) => {
              const photoUrl = photoUrls[photo.id];
              return (
                <div key={photo.id} className="relative group">
                  {photoUrl && (
                    <Image
                      src={photoUrl}
                      alt="Room photo"
                      width={400}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                  )}
                  {photo.linkedTo?.segmentId && (
                    <div className="absolute top-1 left-1 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                      {photo.linkedTo.segmentId}
                    </div>
                  )}
                  {photo.caption && (
                    <div className="absolute bottom-1 left-1 right-1 px-2 py-1 bg-overlay/70 text-white text-xs rounded truncate">
                      {photo.caption}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          No photos captured yet.
        </div>
      )}
    </div>
  );
}
