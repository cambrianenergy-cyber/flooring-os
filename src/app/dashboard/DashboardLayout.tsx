import { FounderBadge } from "@/components/FounderBadge";
import { TopTabs } from "@/components/TopTabs";
import { NAV_ITEMS } from "@/lib/navItems";
import { useWorkspace } from "@/lib/workspaceContext";
import { useWorkspaceEntitlements } from "@/hooks/useWorkspaceEntitlements";
import React from "react";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { workspace } = useWorkspace();
  const workflowItems = NAV_ITEMS.filter((x) => x.group === "workflow");
  const otherItems = NAV_ITEMS.filter((x) => x.group === "other");
  const founderItems = NAV_ITEMS.filter((x) => x.group === "founder");

  // Integrate entitlements hook
  const { planId } = useWorkspaceEntitlements(workspace?.id);

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-background text-slate-900 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-neutral-500">Square Flooring OS</div>
              <div className="text-2xl font-semibold text-neutral-900">
                Founder Dashboard
              </div>
              <div className="text-sm text-neutral-500">
                Workspace {workspace?.id}
              </div>
            </div>
            <FounderBadge isFounder={true} />
          </div>

          {/* Upgrade CTA if on free plan */}
          {planId === "free" && (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
              <span>
                You are on the Free plan. Upgrade to unlock more features!
              </span>
              <a
                href="/billing"
                className="ml-4 px-4 py-2 bg-yellow-400 text-yellow-900 font-semibold rounded hover:bg-yellow-300 transition"
              >
                Upgrade Now
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TopTabs title="Workflow" items={workflowItems} />
            </div>
            <div className="flex flex-col gap-6">
              <TopTabs title="Other" items={otherItems} />
              <TopTabs title="Founder" items={founderItems} />
            </div>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
