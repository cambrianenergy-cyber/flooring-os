import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export function useJobDetails(jobId: string) {
  const [job, setJob] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [labor, setLabor] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    async function fetchAll() {
      const jobSnap = await getDoc(doc(db, "jobs", jobId));
      setJob(jobSnap.exists() ? { id: jobSnap.id, ...jobSnap.data() } : null);
      const [roomsSnap, materialsSnap, laborSnap] = await Promise.all([
        getDocs(collection(db, `jobs/${jobId}/rooms`)),
        getDocs(collection(db, `jobs/${jobId}/materials`)),
        getDocs(collection(db, `jobs/${jobId}/labor`)),
      ]);
      setRooms(roomsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMaterials(materialsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLabor(laborSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchAll();
  }, [jobId]);

  return { job, rooms, materials, labor, loading };
}
