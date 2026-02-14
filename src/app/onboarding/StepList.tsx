const STEPS = [
  { label: "Welcome", path: "/onboarding/welcome" },
  { label: "Company", path: "/onboarding/2" },
  { label: "Service Area", path: "/onboarding/3" },
  { label: "Team", path: "/onboarding/4" },
  { label: "Services", path: "/onboarding/5" },
  { label: "Pricing", path: "/onboarding/6" },
  { label: "Leads", path: "/onboarding/7" },
  { label: "Estimates", path: "/onboarding/8" },
  { label: "Catalog", path: "/onboarding/9" },
  { label: "Integrations", path: "/onboarding/10" },
  { label: "Review", path: "/onboarding/11" },
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
