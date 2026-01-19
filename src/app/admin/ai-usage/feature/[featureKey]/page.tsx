import React from "react";
// import { useParams } from "next/navigation";

export default function FeatureUsagePage() {
  // const { featureKey } = useParams();
  // TODO: Fetch feature usage data from backend
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Feature Usage Deep Dive</h1>
      {/* Usage trend chart */}
      <div className="mb-8">[Usage Trend Chart]</div>
      {/* Who uses it */}
      <div className="mb-8">[User Table]</div>
      {/* Examples of outputs (optional) */}
      <div className="mb-8">[Example Outputs]</div>
      {/* Monetization CTA */}
      <div>[Enable Workflow Pack CTA]</div>
    </div>
  );
}
