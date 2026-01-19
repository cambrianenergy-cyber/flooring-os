import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export function useCadUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function uploadCadFile(file: File, roomId: string) {
    setUploading(true);
    setError(null);
    setDownloadUrl(null);
    try {
      const fileRef = ref(storage, `cad-drawings/${roomId}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setDownloadUrl(url);
      setUploading(false);
      return url;
    } catch (e: any) {
      setError(e.message || "Upload failed");
      setUploading(false);
      throw e;
    }
  }

  return { uploadCadFile, uploading, error, downloadUrl };
}
