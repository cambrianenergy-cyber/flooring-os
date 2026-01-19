"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { AIUsageBanner } from "@/app/components/AIUsageBanner";
import { AIUsageHistoryChart } from "@/app/components/AIUsageHistoryChart";
import { NextStepBanner } from "@/app/components/NextStepBanner";
import { getTokensUsedMTD, getTopUserAndFeatureMTD, getNextResetDate, getProjectedExhaustionDate } from "@/lib/aiDashboard";
import { resolvePlan } from "@/lib/plans";
import { AdminOverridePanel } from "@/app/components/AdminOverridePanel";

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [workspace, setWorkspace] = useState<{ name: string; plan?: { key: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiUsage, setAiUsage] = useState<{
    percent: number;
    used: number;
    cap: number;
    planKey: string;
    isElite: boolean;
  } | null>(null);
  const [hasEstimate, setHasEstimate] = useState(false);
  const [hasJob, setHasJob] = useState(false);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [topFeature, setTopFeature] = useState<{ featureKey: string; count: number } | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [resetDate, setResetDate] = useState<Date>(getNextResetDate());

  useEffect(() => {
    async function fetchWorkspace() {
      setLoading(true);
      const q = query(collection(db, "workspaces"), where("slug", "==", workspaceId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setWorkspace({
          name: data.name ?? "Workspace",
          plan: data.plan ? { key: data.plan.key } : undefined
        });
      }
      setLoading(false);
    }
    async function fetchEmptyStates() {
      if (!workspaceId) return;
      const [estimates, jobs, invoices, reviews] = await Promise.all([
        getDocs(query(collection(db, "estimates"), where("workspaceId", "==", workspaceId), where("status", "!=", "archived"))),
        getDocs(query(collection(db, "jobs"), where("workspaceId", "==", workspaceId))),
        getDocs(query(collection(db, "invoices"), where("workspaceId", "==", workspaceId))),
        getDocs(query(collection(db, "reviews"), where("workspaceId", "==", workspaceId))),
      ]);
      setHasEstimate(!estimates.empty);
      setHasJob(!jobs.empty);
      setHasInvoice(!invoices.empty);
      setHasReview(!reviews.empty);
    }
    fetchWorkspace();
    fetchEmptyStates();
  }, [workspaceId]);

  useEffect(() => {
    async function fetchAIUsage() {
      if (!workspaceId || !workspace) return;
      const plan = resolvePlan(workspace.plan?.key);
      const cap = plan.monthlyAiCredits;
      const isElite = plan.key === "elite";
      const usage = await getTokensUsedMTD(workspaceId, cap);
      setAiUsage({ ...usage, planKey: plan.key, isElite });
      const { topFeature } = await getTopUserAndFeatureMTD(workspaceId);
      setTopFeature(topFeature);
      const projected = await getProjectedExhaustionDate(workspaceId, cap);
      setDaysRemaining(
        projected && projected > new Date() ?
          Math.ceil((projected.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) :
          null
      );
      setResetDate(getNextResetDate());
    }
    fetchAIUsage();
  }, [workspaceId, workspace]);

  if (loading) return <div className="p-8 text-[#9fb2c9]">Loading workspace\u2026</div>;
  if (!workspace) return <div className="p-8 text-[#ff9b76]">Workspace not found.</div>;

  return (
    <div className="p-8 text-[#e8edf7]">
      <h1 className="text-2xl font-bold mb-2 text-[#e8edf7]">Workspace: {workspace?.name}</h1>
      <div className="text-[#9fb2c9] mb-4">ID: {workspaceId}</div>
      <NextStepBanner
        hasEstimate={hasEstimate}
        hasJob={hasJob}
        hasInvoice={hasInvoice}
        hasReview={hasReview}
      />
      {aiUsage && (
        <>
          <AIUsageBanner
            percent={aiUsage.percent}
            used={aiUsage.used}
            cap={aiUsage.cap}
            daysRemaining={daysRemaining}
            resetDate={resetDate}
            topFeature={topFeature}
            isElite={aiUsage.isElite}
          />
          <div className="my-8">
            <AIUsageHistoryChart workspaceId={workspaceId} />
          </div>
        </>
      )}
      <div className="text-sm text-[#7985a8]">(Dashboard content for this workspace goes here.)</div>
      <AdminOverridePanel
        onForceInvite={async (email: string) => {
          const res = await fetch("/api/admin/force-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId, email }),
          });
          if (!res.ok) throw new Error("Failed to send invite");
        }}
        onResetQuota={async () => {
          const res = await fetch("/api/admin/reset-quota", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId }),
          });
          if (!res.ok) throw new Error("Failed to reset quota");
        }}
        onUnlockFeature={async (feature: string) => {
          const res = await fetch("/api/admin/unlock-feature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId, feature }),
          });
          if (!res.ok) throw new Error("Failed to unlock feature");
        }}
      />
    </div>
  );
}
