import React, { useRef, useState } from "react";

export default function ProductPhotoUpload({ onUpload }: { onUpload: (file: File) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      onUpload(e.target.files[0]);
      setUploading(false);
    }
  };

  return (
    <div className="my-4">
      <input
        type="file"
        accept="image/*"
        ref={fileInput}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded shadow"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload Photo"}
      </button>
    </div>
  );
}
