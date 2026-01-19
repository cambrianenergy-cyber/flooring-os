"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


import { useUserRole } from "@/lib/useUserRole";
import { auth } from "@/lib/firebase";
import { isFounder } from "@/lib/auth-utils";
import { usePlanGate } from "@/lib/usePlanGate";

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useUserRole();
  const user = auth.currentUser;
  const email = user?.email || null;
  // Assume planKey is available from user context or session (replace 'pro' with actual planKey source)
  const planKey = 'pro';
  const { features } = usePlanGate(planKey);
  const nav = [
    { name: "Home", href: "/app/home" },
    { name: "Leads", href: "/app/leads" },
    { name: "Jobs", href: "/app/jobs" },
    { name: "Measure", href: "/app/measure" },
    { name: "Room Photos", href: "/app/room-photos" },
    { name: "Catalog", href: "/app/catalog" },
    { name: "Tasks", href: "/app/tasks" },
    { name: "Schedule", href: "/app/schedule" },
    { name: "Messages", href: "/app/messages" },
    { name: "Dashboard", href: "/app/dashboard" },
    { name: "Settings", href: "/app/settings" },
    { name: "Workflow Runs", href: "/app/workflow-runs" },
    // Add AI Agents link if a relevant feature is enabled (e.g., estimateIntelligence or another real feature)
    ...(features.estimateIntelligence ? [{ name: "AI Agents", href: "/app/ai-agents" }] : []),
    { name: "Observability", href: "/app/observability" },
    ...(role === "owner" || role === "admin" || isFounder(email)
      ? [{ name: "Team", href: "/app/team" }]
      : []),
  ];

  return (
    <aside className="w-full md:w-64 border-r bg-page-surface text-foreground border-dark-border">
      <div className="p-6 flex flex-col items-center border-b border-dark-border">
        <div className="text-2xl font-bold tracking-tight mb-1">Square Flooring Pro Suite</div>
        <div className="text-xs text-muted">Flooring OS</div>
      </div>
      <nav className="px-4 py-6 space-y-2">
        {nav.map((item) => {
          const activePath = pathname ?? "";
          const active = activePath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-base font-medium transition-all border
                ${active ? "bg-page-panel text-foreground border-accent" : "hover:bg-page-panel/80 hover:text-foreground border-transparent"}
              `}
            >
              {/* Add icons here for each nav item if desired */}
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
