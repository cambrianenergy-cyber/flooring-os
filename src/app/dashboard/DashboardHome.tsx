import { ActionList } from "@/components/ActionList";
import { StatCard } from "@/components/StatCard";

export default function DashboardHome() {
  // ...existing code...
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          label="Quotes Sent (7d)"
          value="42"
          hint="Close rate trending up"
        />
        <StatCard label="Active Jobs" value="18" hint="3 blocked (materials)" />
        <StatCard label="Invoices Due" value="$27,940" hint="5 overdue" />

        <div className="md:col-span-3 rounded-3xl bg-background text-slate-900 p-6 shadow-sm">
          <div className="text-lg font-semibold text-neutral-900">
            Founder Command Center
          </div>
          <div className="mt-2 text-sm text-neutral-600">
            Spot bottlenecks, protect margin, and keep cashflow moving.
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="Gross Margin (30d)"
              value="38.7%"
              hint="Target: 40%"
            />
            <StatCard
              label="Discounts (30d)"
              value="$4,120"
              hint="2 requests pending approval"
            />
            <StatCard
              label="Collections Risk"
              value="Medium"
              hint="AR aging rising"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <ActionList
          title="Stuck Items"
          items={[
            {
              title: "9 estimates waiting follow-up",
              subtitle: "Oldest: 4 days",
              cta: "Open queue",
            },
            {
              title: "3 jobs blocked by materials",
              subtitle: "Needs purchase approval",
              cta: "Review",
            },
            {
              title: "5 invoices overdue",
              subtitle: "Total: $8,440",
              cta: "Collect",
            },
          ]}
        />
        <ActionList
          title="Founder Alerts"
          items={[
            {
              title: "Margin below floor on 2 estimates",
              subtitle: "Approval required",
              cta: "Inspect",
            },
            {
              title: "Unusual discount pattern",
              subtitle: "Same rep, same zip code",
              cta: "Investigate",
            },
          ]}
        />
      </div>
    </div>
  );
}
