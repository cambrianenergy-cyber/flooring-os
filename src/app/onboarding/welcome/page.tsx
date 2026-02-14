"use client";
import { useRouter } from "next/navigation";
import OnboardingLayout from "../OnboardingLayout";

const ONBOARDING_STEPS = [
  { label: "Welcome", completed: true },
  { label: "Company Info", completed: false },
  { label: "Service Area", completed: false },
  { label: "Team", completed: false },
  { label: "Services", completed: false },
  { label: "Pricing", completed: false },
  { label: "Leads", completed: false },
  { label: "Estimates", completed: false },
  { label: "Catalog", completed: false },
  { label: "Integrations", completed: false },
  { label: "Review", completed: false },
];

export default function OnboardingWelcomePage() {
  const router = useRouter();
  
  return (
    <OnboardingLayout step={0}>
      <div className="max-w-2xl mx-auto p-8">
        {/* Progress Indicator */}
        <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Workspace Setup Progress
            </h3>
            <span className="text-sm text-slate-500">Step 1 of {ONBOARDING_STEPS.length}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(1 / ONBOARDING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Step Checklist */}
          <div className="grid grid-cols-2 gap-2">
            {ONBOARDING_STEPS.map((step, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                  step.completed 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  {step.completed ? '✓' : '○'}
                </div>
                <span className={`text-sm ${
                  step.completed ? 'text-slate-700 font-medium' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">Welcome to SquareOS</h1>
        <p className="text-xl font-semibold text-slate-700 mb-3">
          Build the command center for your flooring business.
        </p>
        <p className="text-lg text-slate-600 mb-6">
          In the next 5 minutes, you'll configure everything needed to run estimates, 
          track leads, manage crews, and close jobs — all in one place.
        </p>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">What you'll set up:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Company profile and information</li>
            <li>Service area and coverage</li>
            <li>Team members and roles</li>
            <li>Services and pricing</li>
            <li>Lead intake and estimates</li>
            <li>Product catalog</li>
            <li>Integrations</li>
          </ul>
        </div>
        
        <button
          onClick={() => router.push("/onboarding/2")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Get Started →
        </button>
      </div>
    </OnboardingLayout>
  );
}
