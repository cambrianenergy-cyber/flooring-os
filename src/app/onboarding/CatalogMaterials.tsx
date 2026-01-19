"use client";
import { useState, useEffect } from "react";
import { logOnboardingEvent } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import OnboardingProgress from "./OnboardingProgress";

export default function CatalogMaterials() {
  // TODO: Replace with actual workspaceId from user/session/context
  const workspaceId = "demo-workspace";
  const onboardingRef = doc(db, "workspaces", workspaceId, "onboarding", "state");
  useEffect(() => { logOnboardingEvent("visited", 9, {}); }, []);
        // Product suggestions (demo)
        const productSuggestions = ["LVP", "Carpet", "Tile", "Hardwood", "Vinyl"];
        const [showProductSuggestions, setShowProductSuggestions] = useState(false);

        // Supplier suggestions (demo)
        const supplierSuggestions = ["https://supplier1.com", "https://supplier2.com", "https://supplier3.com"];
        const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);

        // Supplier link validation (demo)
        function isValidUrl(url: string) {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        }
    const router = useRouter();
    const [products, setProducts] = useState("");
    const [supplierLinks, setSupplierLinks] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setSaving(true);
      setError(null);
      // Optional fields
      const productList = products ? products.split(/[,\s]+/).filter(Boolean) : null;
      const supplierList = supplierLinks ? supplierLinks.split(/[,\s]+/).filter(Boolean) : null;
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not authenticated");
          setSaving(false);
          await logOnboardingEvent("error", 9, { error: "Not authenticated" });
          return;
        }
        // TODO: Replace with workflowStates path
        await runTransaction(db, async (transaction) => {
          transaction.update(onboardingRef, {
            'data.products': productList,
            'data.supplierLinks': supplierList,
            updatedAt: serverTimestamp(),
            currentStep: 9,
            completedSteps: [1,2,3,4,5,6,7,8,9],
          });
        });
        await logOnboardingEvent("saved", 9, { products: productList, supplierLinks: supplierList });
        router.push("/onboarding/step/10");
      } catch (err) {
        let message = "Failed to save. Please try again.";
        if (
          typeof err === "object" &&
          err !== null &&
          "message" in err &&
          typeof (err as { message?: unknown }).message === "string"
        ) {
          message += `\n${(err as { message: string }).message}`;
        }
        setError(message);
        await logOnboardingEvent("error", 9, { error: message });
      } finally {
        setSaving(false);
      }
    }

    async function handleSkip() {
      setSaving(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not authenticated");
          setSaving(false);
          return;
        }
        // TODO: Replace with workflowStates path
        await runTransaction(db, async (transaction) => {
          transaction.update(onboardingRef, {
            updatedAt: serverTimestamp(),
            currentStep: 9,
            completedSteps: [1,2,3,4,5,6,7,8,9],
          });
        });
        router.push("/onboarding/step/10");
      } catch {
        setError("Failed to skip. Please try again.");
      } finally {
        setSaving(false);
      }
    }

    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground">
          <OnboardingProgress currentStep={9} totalSteps={10} stepLabels={["Welcome","Company Profile","Service Area","Team Setup","Trade Types","Pricing Defaults","Lead Intake","Estimate Workflow","Catalog","Integrations"]} />
          <h1 className="text-xl font-semibold mb-4 text-foreground">Catalog / Materials</h1>
          <label className="block mt-2 text-sm">Top Products (comma or space separated)</label>
          <div className="flex items-center mt-2">
            <label htmlFor="products" className="block text-sm">Top Products (comma or space separated)</label>
            <span className="ml-2 text-xs text-muted cursor-help" title="List your top products. Click for suggestions." onClick={() => setShowProductSuggestions(!showProductSuggestions)}>?</span>
          </div>
          <input id="products" className="w-full border rounded-md p-2 mt-1" value={products} onChange={e => setProducts(e.target.value)} placeholder="LVP, Carpet, Tile, ..." aria-label="Top Products" />
          {showProductSuggestions && (
            <ul className="mt-1 text-xs bg-muted rounded p-2">
              {productSuggestions.map(p => (
                <li key={p} className="cursor-pointer hover:text-accent" onClick={() => { setProducts(products ? products + ", " + p : p); setShowProductSuggestions(false); }}>{p}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 mt-1">
            {productSuggestions.map(p => (
              <span key={p} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setProducts(products ? products + ", " + p : p)}>{p}</span>
            ))}
          </div>
          <label className="block mt-3 text-sm">Supplier Links (comma or space separated)</label>
          <div className="flex items-center mt-3">
            <label htmlFor="supplierLinks" className="block text-sm">Supplier Links (comma or space separated)</label>
            <span className="ml-2 text-xs text-muted cursor-help" title="Paste links to your suppliers. Click for suggestions." onClick={() => setShowSupplierSuggestions(!showSupplierSuggestions)}>?</span>
          </div>
          <input id="supplierLinks" className="w-full border rounded-md p-2 mt-1" value={supplierLinks} onChange={e => setSupplierLinks(e.target.value)} placeholder="https://supplier1.com, https://supplier2.com" aria-label="Supplier Links" />
          {showSupplierSuggestions && (
            <ul className="mt-1 text-xs bg-muted rounded p-2">
              {supplierSuggestions.map(s => (
                <li key={s} className="cursor-pointer hover:text-accent" onClick={() => { setSupplierLinks(supplierLinks ? supplierLinks + ", " + s : s); setShowSupplierSuggestions(false); }}>{s}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 mt-1">
            {supplierSuggestions.map(s => (
              <span key={s} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setSupplierLinks(supplierLinks ? supplierLinks + ", " + s : s)}>{s}</span>
            ))}
          </div>
          {supplierLinks && supplierLinks.split(/[\,\s]+/).some(link => !isValidUrl(link)) && (
            <div className="text-xs text-danger mt-1">Please enter valid URLs for all supplier links.</div>
          )}
          {error && (
            <div className="text-danger mt-2 whitespace-pre-line" role="alert">
              {error}
              <button
                type="button"
                className="ml-2 underline text-accent"
                onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                disabled={saving}
                aria-label="Retry"
              >
                Retry
              </button>
            </div>
          )}
          <button className="w-full mt-5 bg-accent text-background rounded-md p-2 font-medium" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save & Continue"}
          </button>
          <button
            type="button"
            className="w-full mt-2 bg-muted text-background rounded-md p-2 font-medium"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setError(null);
              try {
                const user = auth.currentUser;
                if (!user) {
                  setError("Not authenticated");
                  setSaving(false);
                  return;
                }
                // TODO: Replace with workflowStates path
                await runTransaction(db, async (transaction) => {
                  transaction.update(onboardingRef, {
                    'data.products': products ? products.split(/[\,\s]+/).filter(Boolean) : null,
                    'data.supplierLinks': supplierLinks ? supplierLinks.split(/[\,\s]+/).filter(Boolean) : null,
                    updatedAt: serverTimestamp(),
                  });
                });
              } catch {
                setError("Failed to save draft. Please try again.");
              } finally {
                setSaving(false);
              }
            }}
            aria-label="Save Draft"
          >
            Save Draft
          </button>
          <div className="mt-4 text-xs text-muted-foreground" aria-live="polite">
            <span role="note">Your catalog/materials info is private and only used for onboarding. <a href="/privacy" className="underline text-accent" target="_blank" rel="noopener noreferrer">Privacy Policy</a></span>
          </div>
          <button
            type="button"
            className="w-full mt-2 bg-muted text-background rounded-md p-2 font-medium"
            disabled={saving}
            onClick={handleSkip}
          >
            Skip for now
          </button>
        </form>
      </main>
    );
}
