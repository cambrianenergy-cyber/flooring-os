import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { withWorkspace, withUpdate } from "@/lib/withWorkspace";

export async function addRoomToJob(jobId: string, room: { name: string; measurements?: Record<string, number>; photos?: string[]; }) {
  const roomId = doc(collection(db, `jobs/${jobId}/rooms`)).id;
  const roomData = {
    ...room,
    measurements: room.measurements || {},
    photos: room.photos || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, `jobs/${jobId}/rooms`, roomId), roomData);
  return roomId;
}

export async function addMaterialToJob(jobId: string, material: { productId: string; name: string; quantity: number; unit: string; cost: number; sellPrice: number; assignedRoomId?: string | null; }) {
  const materialId = doc(collection(db, `jobs/${jobId}/materials`)).id;
  const materialData = {
    ...material,
    assignedRoomId: material.assignedRoomId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, `jobs/${jobId}/materials`, materialId), materialData);
  return materialId;
}

export async function addLaborToJob(jobId: string, labor: { type: string; hours: number; rate: number; assignedRoomId?: string | null; }) {
  const laborId = doc(collection(db, `jobs/${jobId}/labor`)).id;
  const laborData = {
    ...labor,
    assignedRoomId: labor.assignedRoomId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, `jobs/${jobId}/labor`, laborId), laborData);
  return laborId;
}
