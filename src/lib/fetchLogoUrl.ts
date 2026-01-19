import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function fetchLogoUrl(): Promise<string | null> {
  try {
    const storageRef = ref(storage, "branding/logo.png");
    return await getDownloadURL(storageRef);
  } catch {
    return null;
  }
}
