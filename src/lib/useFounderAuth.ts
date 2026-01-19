"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isFounder } from "@/lib/auth-utils";

export function useFounderAuth() {
  const [isFounderUser, setIsFounderUser] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsFounderUser(!!user && isFounder(user.email));
      setReady(true);
    });
    return () => unsub();
  }, []);

  return { isFounderUser, ready };
}
