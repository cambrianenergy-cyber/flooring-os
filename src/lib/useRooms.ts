// useRooms.ts
// React hook for real-time Firestore room data

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";
import { debugOnSnapshot } from "./debugOnSnapshot";

export interface Room {
  id: string;
  name: string;
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = debugOnSnapshot(
      collection(db, "rooms"),
      "ROOMS_LISTENER",
      (snap: QuerySnapshot<DocumentData>) => {
        setRooms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { rooms, loading, error };
}
