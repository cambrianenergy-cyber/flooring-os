import React from "react";
import { resolvePlan } from "@/lib/plans";

export function PlanStatusBanner({ planKey, status, currentPeriodEnd }: { planKey: string; status: string; currentPeriodEnd: Date | null }) {
  const plan = resolvePlan(planKey);
  let message = null;
  let color = "bg-blue-100 text-blue-900";

  if (status !== "active") {
    message = `Your subscription is ${status}. Please update billing to restore access.`;
    color = "bg-red-100 text-red-900";
  } else if (currentPeriodEnd && currentPeriodEnd < new Date()) {
    message = `Your subscription period ended on ${currentPeriodEnd.toLocaleDateString()}. Please renew to continue using ${plan.name}.`;
    color = "bg-orange-100 text-orange-900";
  } else {
    message = `Plan: ${plan.name} (${status})`;
  }

  return (
    <div className={`rounded p-3 mb-4 font-semibold ${color}`}>
      {message}
    </div>
  );
}
