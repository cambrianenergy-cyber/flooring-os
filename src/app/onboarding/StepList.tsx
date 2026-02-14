const STEPS = [
  { label: "Welcome", path: "/onboarding/welcome" },
  { label: "Company Profile", path: "/onboarding/2" },
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
    <nav className="w-64 space-y-1">
      {STEPS.map((step, i) => {
        const stepNumber = i;
        const isCompleted = stepNumber < current;
        const isCurrent = stepNumber === current;
        const isFuture = stepNumber > current;
        
        return (
          <a
            key={step.path}
            href={step.path}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
              ${isCurrent ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 shadow-sm' : ''}
              ${isCompleted ? 'text-slate-700 hover:bg-slate-50' : ''}
              ${isFuture ? 'text-slate-400 hover:bg-slate-50' : ''}
            `}
          >
            <span className="text-lg flex-shrink-0">
              {isCompleted && '✔'}
              {isCurrent && '➡'}
              {isFuture && '⬜'}
            </span>
            <span className="text-sm">{step.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

