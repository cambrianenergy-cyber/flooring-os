"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not authenticated, redirect to login
        router.replace("/login");
        return;
      }

      try {
        // Check if user has completed onboarding
        const userDoc = await getDocs(
          query(collection(db, "users"), where("uid", "==", user.uid))
        );

        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          
          // If onboarding not complete, redirect to onboarding
          if (!userData.onboardingComplete) {
            router.replace("/onboarding");
            return;
          }
        }

        // Get user's workspaces
        const workspacesQuery = query(
          collection(db, "workspaces"),
          where("members", "array-contains", user.uid)
        );
        const workspacesSnapshot = await getDocs(workspacesQuery);

        if (workspacesSnapshot.empty) {
          // No workspace found, redirect to onboarding
          router.replace("/onboarding");
          return;
        }

        // Get the first workspace (or primary workspace)
        const firstWorkspace = workspacesSnapshot.docs[0];
        const workspaceId = firstWorkspace.id;

        // Redirect to workspace dashboard
        router.replace(`/app/${workspaceId}/dashboard`);
      } catch (error) {
        console.error("Error loading workspace:", error);
        // Fallback to dashboard
        router.replace("/dashboard");
      }
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
