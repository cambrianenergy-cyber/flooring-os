"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
type OnboardingData = {
  step?: string;
  persona?: string;
  companyType?: string;
  monthlyVolume?: string;
  setupMode?: string;
  goals?: string[];
  [key: string]: unknown;
};

// Singleton listener map to prevent duplicate listeners per workspaceId
const onboardingListenerMap: Record<string, {
  data: OnboardingData | null;
  loading: boolean;
  setStates: Set<React.Dispatch<React.SetStateAction<OnboardingData | null>>>;
  setLoadings: Set<React.Dispatch<React.SetStateAction<boolean>>>;
  unsubscribe?: () => void;
}> = {};

export function useOnboardingState(workspaceId: string) {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    if (!onboardingListenerMap[workspaceId]) {
      onboardingListenerMap[workspaceId] = {
        data: null,
        loading: true,
        setStates: new Set(),
        setLoadings: new Set(),
      };
      const ref = doc(db, "workspaces", workspaceId, "onboarding", "state");
      console.log(`[onboarding] Attaching Firestore listener for workspaceId=${workspaceId}`);
      onboardingListenerMap[workspaceId].unsubscribe = onSnapshot(ref, (snap) => {
        const newData = snap.exists() ? snap.data() : null;
        onboardingListenerMap[workspaceId].data = newData;
        onboardingListenerMap[workspaceId].loading = false;
        onboardingListenerMap[workspaceId].setStates.forEach(fn => fn(newData));
        onboardingListenerMap[workspaceId].setLoadings.forEach(fn => fn(false));
      });
    }
    // Register this component's setState
    onboardingListenerMap[workspaceId].setStates.add(setData);
    onboardingListenerMap[workspaceId].setLoadings.add(setLoading);

    // Set initial state only if different, and defer to next tick to avoid React warning
    Promise.resolve().then(() => {
      if (onboardingListenerMap[workspaceId].data !== data) setData(onboardingListenerMap[workspaceId].data);
      if (onboardingListenerMap[workspaceId].loading !== loading) setLoading(onboardingListenerMap[workspaceId].loading);
    });

    return () => {
      // Remove this component's setState
      onboardingListenerMap[workspaceId].setStates.delete(setData);
      onboardingListenerMap[workspaceId].setLoadings.delete(setLoading);
      // If no more listeners, unsubscribe
      if (
        onboardingListenerMap[workspaceId].setStates.size === 0 &&
        onboardingListenerMap[workspaceId].setLoadings.size === 0 &&
        onboardingListenerMap[workspaceId].unsubscribe
      ) {
        console.log(`[onboarding] Detaching Firestore listener for workspaceId=${workspaceId}`);
        onboardingListenerMap[workspaceId].unsubscribe?.();
        delete onboardingListenerMap[workspaceId];
      }
    };
  }, [workspaceId, data, loading]);

  return { data, loading };
}

import React from "react";

interface FormCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

export function FormCard({ title, subtitle, children }: FormCardProps) {
  return (
    <div className="mb-6 rounded-xl border bg-page-surface p-6 shadow-sm">
      <div className="mb-2 text-lg font-semibold">{title}</div>
      {subtitle && <div className="mb-4 text-sm text-slate-500">{subtitle}</div>}
      {children}
    </div>
  );
}
