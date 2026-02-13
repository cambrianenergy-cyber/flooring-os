"use client";
import { isFounder } from "@/lib/auth-utils";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export function useFounderAuth() {
  const [isFounderUser, setIsFounderUser] = useState(false);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsFounderUser(!!user && isFounder(user.email));
      setReady(true);
    });
    return () => unsub();
  }, []);

  return { isFounderUser, ready, user };
}
