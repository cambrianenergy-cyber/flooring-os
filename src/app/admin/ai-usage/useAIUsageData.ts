"use client";
import { useEffect, useState } from "react";

export interface AIUsageRecord {
  id: string;
  workspaceId: string;
  kind: string;
  createdAt: string;
  tokens: number;
  featureKey?: string;
  uid?: string;
  // ...other fields as needed
}

export function useAIUsageData(workspaceId: string, monthKey: string) {
  const [data, setData] = useState<AIUsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    fetch(`/api/ai_usage?workspaceId=${workspaceId}&monthKey=${monthKey}`)
      .then(res => res.json())
      .then(res => {
        setData(res.aiUsage || []);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || "Failed to fetch");
        setLoading(false);
      });
  }, [workspaceId, monthKey]);

  return { data, loading, error };
}
