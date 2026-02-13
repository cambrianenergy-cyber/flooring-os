"use client";

import Link from "next/link";

const STEPS = [
  { key: "welcome", label: "Welcome", href: "/onboarding/welcome" },
  { key: "company", label: "Company", href: "/onboarding/company" },
  { key: "team", label: "Team", href: "/onboarding/team" },
  { key: "stripe", label: "Payments", href: "/onboarding/stripe" },
  { key: "pricing", label: "Pricing", href: "/onboarding/pricing" },
  { key: "packs", label: "Packs", href: "/onboarding/packs" },
  { key: "ai", label: "AI", href: "/onboarding/ai" },
  { key: "import", label: "Import", href: "/onboarding/import" },
  { key: "security", label: "Security", href: "/onboarding/security" },
  { key: "review", label: "Launch", href: "/onboarding/review" },
];

export function Stepper({ currentKey }: { currentKey: string }) {
  const idx = Math.max(
    0,
    STEPS.findIndex((s) => s.key === currentKey),
  );
  const pct = Math.round(((idx + 1) / STEPS.length) * 100);

  return (
    <div className="rounded-2xl border bg-background text-slate-900 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">Onboarding</div>
          <div className="text-xl font-semibold">
            Step {idx + 1} of {STEPS.length}: {STEPS[idx]?.label}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            You can change everything later.
          </div>
        </div>
        <div className="min-w-[160px] text-right">
          <div className="text-xs text-slate-500">{pct}% complete</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((s) => {
          const active = s.key === currentKey;
          return (
            <Link
              key={s.key}
              href={s.href}
              className={[
                "rounded-full border px-3 py-1 text-xs transition",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-background text-slate-700 hover:bg-slate-50 text-slate-900",
              ].join(" ")}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
