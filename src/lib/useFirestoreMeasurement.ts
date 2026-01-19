import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function saveMeasurement(roomId: string, data: { cadUrl?: string; [key: string]: any }) {
  const measurementsRef = collection(db, `rooms/${roomId}/measurements`);
  await addDoc(measurementsRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
}
