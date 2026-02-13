import { PLANS, PlanKey } from "@/lib/stripe/plans";
import { useState } from "react";

function getFriendlyError(error: string) {
  if (error.includes("network"))
    return "Network error. Please check your connection and try again.";
  if (error.includes("Workspace not found"))
    return "Workspace not found. Please reload or contact support.";
  if (error.includes("Invalid plan"))
    return "Selected plan is not available. Please try again.";
  if (error.includes("Missing workspaceId/planId"))
    return "Missing workspace or plan information. Please reload the page.";
  return error;
}

export default function UpgradeButton({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(planId: PlanKey) {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, planId }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(
          getFriendlyError(data.error || "Failed to create checkout session"),
        );
      }
    } catch (err: any) {
      setError(getFriendlyError(err.message || "Unknown error"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      {Object.values(PLANS).map((plan) => (
        <button
          key={plan.key}
          onClick={() => handleUpgrade(plan.key)}
          disabled={!!workspaceId === false || loading === plan.key}
          className={
            plan.key === "starter"
              ? "bg-blue-600 text-white px-4 py-2 rounded mr-2"
              : plan.key === "pro"
                ? "bg-green-600 text-white px-4 py-2 rounded mr-2"
                : "bg-purple-600 text-white px-4 py-2 rounded"
          }
        >
          {loading === plan.key ? (
            <span className="flex items-center">
              <span className="loader mr-2" />
              Redirecting...
            </span>
          ) : (
            `Upgrade to ${plan.name}`
          )}
        </button>
      ))}
      {loading && (
        <div className="flex items-center mt-2">
          <span className="loader mr-2" />
          Processing your upgrade…
        </div>
      )}
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <style jsx>{`
        .loader {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #555;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
