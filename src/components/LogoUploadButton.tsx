"use client";
import { useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface LogoUploadButtonProps {
  onLogoUploaded?: (url: string) => void;
}

export default function LogoUploadButton({ onLogoUploaded }: LogoUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const storageRef = ref(storage, `branding/logo.png`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onLogoUploaded?.(url);
    } catch (err: any) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="inline-block cursor-pointer rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
        {uploading ? "Uploading..." : "Upload Logo"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
}
