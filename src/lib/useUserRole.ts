// src/lib/useUserRole.ts
"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { UserRole } from "@/lib/roles";

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setRole((snap.data().role as UserRole) || null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { role, loading };
}
