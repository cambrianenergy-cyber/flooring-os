import { useEffect, useState } from "react";
import { logOnboardingEvent } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { isFounder } from "@/lib/auth-utils";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";


export default function WelcomeStart() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Only founders can proceed
    if (!isFounder(user.email)) {
      router.replace("/login?error=not_authorized");
      return;
    }
    logOnboardingEvent("visited", 1, {});
  }, [router]);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }
      // Create onboarding doc for this user's workspace (assume workspaceId = user.uid for MVP)
      // TODO: Replace with workflowStates path
      const onboardingRef = doc(db, `onboarding_intake/${user.uid}`);
      await setDoc(onboardingRef, {
        status: "in_progress",
        currentStep: 1,
        completedSteps: [],
        data: {},
        updatedAt: serverTimestamp(),
        planKey: null,
        roles: [],
        members: [user.email],
      });
      await logOnboardingEvent("saved", 1, {});
      router.push("/onboarding/step/2");
    } catch (err) {
      setError("Failed to start onboarding. Please try again.");
      await logOnboardingEvent("error", 1, { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Square Flooring Pro Suite</h1>
        <p className="mb-4 text-muted">Let&apos;s get your business set up for success. Only founders can start onboarding.</p>
        <button
          className="w-full mt-4 bg-accent text-background rounded-md p-2 font-medium"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? "Starting..." : "Start Onboarding"}
        </button>
        {error && <div className="text-danger mt-2">{error}</div>}
        <p className="text-sm text-muted mt-4">
          New user?{' '}
          <a
            className="underline text-accent cursor-pointer"
            href="/signup"
          >
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
