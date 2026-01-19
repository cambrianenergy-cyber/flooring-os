"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { isFounder } from "@/lib/auth-utils";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isFounderUser, setIsFounderUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setReady(true);
        router.replace("/login");
      } else {
        setIsFounderUser(isFounder(user.email));
        setReady(true);
      }
    }, () => {
      setError("Authentication error. Please refresh.");
      setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600 animate-pulse">
        <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
        Loading authentication…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-sm">{error}</div>
    );
  }

  return (
    <>
      {isFounderUser && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 mt-3 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full z-50 shadow-lg">
          👑 Founder
        </div>
      )}
      {children}
    </>
  );
}
