import React from "react";
import Link from "next/link";

interface Props {
  hasEstimate: boolean;
  hasJob: boolean;
  hasInvoice: boolean;
  hasReview: boolean;
}

const steps = [
  { key: "estimate", label: "Create Estimate", cta: "Create your first Estimate", href: "/estimates/new" },
  { key: "job", label: "Create Job", cta: "Convert Estimate to Job", href: "/jobs" },
  { key: "invoice", label: "Send Invoice", cta: "Create and send Invoice", href: "/invoices" },
  { key: "review", label: "Review & Close", cta: "Review and close Job", href: "/reviews" },
];

export function NextStepBanner({ hasEstimate, hasJob, hasInvoice, hasReview }: Props) {
  let nextStep = null;
  if (!hasEstimate) nextStep = steps[0];
  else if (!hasJob) nextStep = steps[1];
  else if (!hasInvoice) nextStep = steps[2];
  else if (!hasReview) nextStep = steps[3];

  if (!nextStep) return null;

  return (
    <div className="bg-indigo-600 text-white rounded p-4 mb-6 flex items-center justify-between shadow">
      <div>
        <span className="font-bold mr-2">Next Step:</span>
        {nextStep.label}
        <span className="ml-4 text-indigo-200">{nextStep.cta}</span>
      </div>
      <Link href={nextStep.href} className="bg-white text-indigo-700 px-4 py-2 rounded font-semibold hover:bg-indigo-100 transition">
        Go
      </Link>
    </div>
  );
}
