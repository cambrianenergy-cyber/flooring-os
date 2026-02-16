import React, { useState } from "react";
import { useRouter } from "next/navigation";

import type { Product } from "@/lib/types";


export default function AgentsDirectory({ userRole }: { userRole: string }) {
  const router = useRouter();
  const showAgentDirectory = ["founder", "owner", "admin"].includes(userRole);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function makeDemoProduct(): Product {
    const now = Date.now();
    return {
      name: "Laminate Driftwood",
      brand: "Acme Floors",
      sku: "LAM-001",
      materialType: "Laminate",
      unit: "sqft",
      costPerSqft: 2.5,
      sellPricePerSqft: 3.5,
      images: [],
      accessories: ["underlayment"],
      createdAt: now,
      updatedAt: now,
    };
  }

  // All agent logic and UI removed due to static export. Render a placeholder.
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-primary">AI Agents Directory</h2>
      <div className="text-secondary">AI agent features are unavailable in static export mode.</div>
    </div>
  );
}
