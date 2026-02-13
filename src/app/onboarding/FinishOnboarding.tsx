"use client";
import InfoTooltip from "@/components/InfoTooltip";
import { auth, db } from "@/lib/firebase";
import { logOnboardingEvent, setOnboardingStatus } from "@/lib/onboarding";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// Import useAuth hook if available, otherwise fallback to auth.currentUser
import { useAuth } from "@/hooks/useAuth";

export default function FinishOnboarding() {
  // Always call hooks unconditionally
  const [error, setError] = useState<string | null>(null);
  const authResult = useAuth();
  const user =
    authResult && "user" in authResult ? authResult.user : auth.currentUser;
  // Removed unused loading state
  const workspaceId = user?.uid;
  const onboardingRef = workspaceId
    ? doc(db, "workspaces", workspaceId, "onboarding", "state")
    : null;
  const router = useRouter();

  useEffect(() => {
    if (!onboardingRef) return;
    async function completeOnboardingIfNeeded() {
      setError(null);
      const currentUser = user || auth.currentUser;
      try {
        if (!currentUser) {
          setError("Not authenticated");
          await logOnboardingEvent("error", 11, { error: "Not authenticated" });
          return;
        }
        await logOnboardingEvent("visited", 11, {});
        // Onboarding completion logic
        if (onboardingRef) {
          const onboardingSnap = await getDoc(onboardingRef);
          if (!onboardingSnap.exists()) {
            setError("No onboarding data found.");
            await logOnboardingEvent("error", 11, {
              error: "No onboarding data found.",
            });
            return;
          }
          const onboardingData = onboardingSnap.data();
          // Only run completion logic if not already complete
          if (onboardingData.status !== "complete") {
            // Extract starter data from onboardingData.data
            const starterData = onboardingData.data || {};
            // Example: log starter data for observability
            await logOnboardingEvent("completed", 11, { starterData });
            // Mark onboarding as complete
            await setOnboardingStatus("complete");
          }
        }
      } catch (err) {
        setError(
          "Failed to complete onboarding. " +
            (err instanceof Error ? err.message : ""),
        );
        await logOnboardingEvent("error", 11, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    completeOnboardingIfNeeded();
  }, [onboardingRef, user]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl border rounded-lg p-6 bg-dark-panel shadow text-foreground">
        <h1 className="text-2xl font-bold mb-4 text-accent flex items-center">
          {/* ...existing code for header... */}
        </h1>
        {/* ...existing code for onboarding summary, error, loading, etc... */}
        {error && (
          <div className="mb-4 text-red-500 text-center" role="alert">
            {error}
          </div>
        )}
        <button
          className="w-full bg-accent text-background rounded-md p-3 font-bold mt-4"
          onClick={() => router.push("/dashboard")}
          aria-label="Go to dashboard"
        >
          Go to Dashboard
        </button>
        <div className="text-xs text-muted mt-3 text-center flex flex-col items-center">
          <span>
            Your privacy is protected.{" "}
            <InfoTooltip text="We never share your onboarding data with third parties. All information is encrypted and handled securely." />
          </span>
        </div>
      </div>
    </main>
  );
}
