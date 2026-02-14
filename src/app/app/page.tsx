"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not authenticated, redirect to login
        router.replace("/login");
        return;
      }

      // Use the user's UID as workspaceId (as created in ClientRootLayout)
      const workspaceId = user.uid;
      
      // Redirect to workspace dashboard
      router.replace(`/app/${workspaceId}/dashboard`);
    });

    return () => unsubscribe();
  }, [router]);

  // Show loading state while checking auth
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
        <p className="mt-4 text-slate-600">Loading...</p>
      </div>
    </div>
  );
}
