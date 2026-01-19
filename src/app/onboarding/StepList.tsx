const STEPS = [
  { label: "Welcome", path: "/onboarding/1" },
  { label: "Company", path: "/onboarding/2-company" },
  { label: "Service Area", path: "/onboarding/3-service-area" },
  { label: "Team", path: "/onboarding/4-team" },
  { label: "Services", path: "/onboarding/5-services" },
  { label: "Pricing", path: "/onboarding/6-pricing" },
  { label: "Leads", path: "/onboarding/7-leads" },
  { label: "Estimates", path: "/onboarding/8-estimates" },
  { label: "Catalog", path: "/onboarding/9-catalog" },
  { label: "Integrations", path: "/onboarding/10-integrations" },
  { label: "Review", path: "/onboarding/11-review" },
];

export default function StepList({ current }: { current: number }) {
  return (
    <nav className="w-56 p-4 bg-dark-surface rounded-lg flex flex-col gap-2">
      {STEPS.map((step, i) => (
        <a
          key={step.path}
          href={step.path}
          className={`block px-3 py-2 rounded font-medium transition ${current === i + 1 ? "bg-accent text-background" : "text-foreground hover:bg-muted"}`}
        >
          {i + 1}. {step.label}
        </a>
      ))}
    </nav>
  );
}
