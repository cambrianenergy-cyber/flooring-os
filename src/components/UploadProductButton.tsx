import React, { useRef } from "react";

export default function UploadProductButton({ onUpload }: { onUpload: (file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <>
      <button
        type="button"
        className="px-3 py-1 bg-blue-600 text-white rounded cursor-pointer"
        onClick={handleClick}
      >
        Upload Product
      </button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".csv,.xlsx,.json,.png,.jpg,.jpeg,.pdf"
        onChange={handleChange}
      />
    </>
  );
}
