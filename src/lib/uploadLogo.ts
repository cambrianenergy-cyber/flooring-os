import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

export async function uploadLogo(
  file: File,
  workspaceId: string,
): Promise<string> {
  const storage = getStorage();
  const logoRef = ref(storage, `workspaces/${workspaceId}/logo`);
  await uploadBytes(logoRef, file);
  return await getDownloadURL(logoRef);
}
