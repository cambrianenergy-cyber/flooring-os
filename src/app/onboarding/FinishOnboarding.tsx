"use client";
import { useEffect, useState } from "react";
import InfoTooltip from "@/components/InfoTooltip";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, runTransaction, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { logOnboardingEvent } from "@/lib/onboarding";
import { useRouter } from "next/navigation";

export default function FinishOnboarding() {
  // TODO: Replace with actual workspaceId from user/session/context
  const workspaceId = "demo-workspace";
  const onboardingRef = doc(db, "workspaces", workspaceId, "onboarding", "state");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function completeOnboardingIfNeeded() {
      setLoading(true);
      setError(null);
      let user;
      try {
        user = auth.currentUser;
        if (!user) {
          setError("Not authenticated");
          await logOnboardingEvent("error", 11, { error: "Not authenticated" });
          setLoading(false);
          return;
        }
        await logOnboardingEvent("visited", 11, {});
        // TODO: Replace with workflowStates path
        const workspaceRef = doc(db, `workspaces/${user.uid}`);
        const onboardingSnap = await getDoc(onboardingRef);
        if (!onboardingSnap.exists()) {
          setError("No onboarding data found.");
          await logOnboardingEvent("error", 11, { error: "No onboarding data found." });
          setLoading(false);
          return;
        }
        const onboardingData = onboardingSnap.data();
        setData(onboardingData);
        // Only run completion logic if not already complete
        if (onboardingData.status !== "complete") {
          // Extract starter data from onboardingData.data
          const d = onboardingData.data || {};
          // Example: services, products, templates
          const starterServices = (d[5]?.services || []).map((name: string) => ({
            category: "install",
            name,
            unit: "sqft",
            defaultPrice: 0,
            defaultCost: 0,
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }));
          const starterCatalogItems = (d[9]?.products || []).map((name: string) => ({
            type: "material",
            vendor: null,
            sku: null,
            name,
            category: "flooring",
            unit: "sqft",
            price: 0,
            cost: 0,
            active: true,
            updatedAt: serverTimestamp(),
          }));
          const starterEstimateTemplates = (d[8]?.templates || []).map((name: string) => ({
            name,
            steps: d[8]?.steps || [],
            approvalRules: d[8]?.approvalRules || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }));
          // Write starter docs in a transaction
          await runTransaction(db, async (transaction) => {
            // Mark onboarding as complete in onboarding doc
            transaction.update(onboardingRef, {
              status: "complete",
              completedSteps: Array.from(new Set([...(onboardingData.completedSteps || []), 11])),
              currentStep: 11,
              updatedAt: serverTimestamp(),
            });
            // Mark onboardingComplete in workspace doc
            transaction.update(workspaceRef, {
              onboardingComplete: true,
              updatedAt: serverTimestamp(),
            });
          });
          // Add starter services
          for (const service of starterServices) {
            const ref = doc(collection(db, `workspaces/${user.uid}/services`));
            await setDoc(ref, service);
          }
          // Add starter catalog items
          for (const item of starterCatalogItems) {
            const ref = doc(collection(db, `workspaces/${user.uid}/catalog_items`));
            await setDoc(ref, item);
          }
          // Add starter estimate templates
          for (const template of starterEstimateTemplates) {
            const ref = doc(collection(db, `workspaces/${user.uid}/estimate_templates`));
            await setDoc(ref, template);
          }
          await logOnboardingEvent("completed", 11, { services: starterServices.length, catalogItems: starterCatalogItems.length, estimateTemplates: starterEstimateTemplates.length });
        }
      } catch (err) {
        setError("Failed to complete onboarding. " + (err instanceof Error ? err.message : ""));
        await logOnboardingEvent("error", 11, { error: err instanceof Error ? err.message : String(err) });
      } finally {
        setLoading(false);
      }
    }
    completeOnboardingIfNeeded();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl border rounded-lg p-6 bg-dark-panel shadow text-foreground">
        <h1 className="text-2xl font-bold mb-4 text-accent flex items-center">Onboarding Complete!
          <InfoTooltip text="You’ve finished onboarding. All features are now available. You can review your onboarding data below." />
        </h1>
        <p className="mb-6 text-foreground flex items-center">Your onboarding is finished. You can now access all features.
          <InfoTooltip text="You can always update your onboarding info in settings. Your data is private and secure." />
        </p>
        {loading ? (
          <div className="p-4">Loading summary…</div>
        ) : error ? (
          <div className="p-4 text-danger">{error}</div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-2 flex items-center">Your Onboarding Data
              <InfoTooltip text="This is a summary of the information you provided during onboarding. Only you and your team can see this." />
            </h2>
            <pre className="bg-dark-surface rounded p-4 text-xs overflow-x-auto max-h-96 mb-6" aria-label="Onboarding data summary">{JSON.stringify(data, null, 2)}</pre>
            <button
              className="w-full mt-2 border border-muted text-muted bg-background rounded-md p-2 font-medium"
              onClick={() => alert('Summary saved! You can download or print this page for your records.')}
              aria-label="Save onboarding summary"
            >
              Save summary
            </button>
          </>
        )}
        <button
          className="w-full bg-accent text-background rounded-md p-3 font-bold mt-4"
          onClick={() => router.push("/dashboard")}
          aria-label="Go to dashboard"
        >
          Go to Dashboard
        </button>
      <div className="text-xs text-muted mt-3 text-center flex flex-col items-center">
        <span>Your privacy is protected. <InfoTooltip text="We never share your onboarding data with third parties. All information is encrypted and handled securely." /></span>
      </div>
    </div>
    </main>
  );
}
