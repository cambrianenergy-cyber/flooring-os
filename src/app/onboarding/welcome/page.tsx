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
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Column - Main Content */}
        <div className="flex-1 max-w-2xl p-8 mx-auto lg:mx-0 lg:ml-auto lg:mr-8">
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
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">What you'll set up:</h2>
          <div className="grid gap-3">
            <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Company Profile</h3>
                  <p className="text-sm text-slate-600">Business info, branding, contact details</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">📍</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Service Area</h3>
                  <p className="text-sm text-slate-600">Define coverage zones and travel radius</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">👥</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Team & Roles</h3>
                  <p className="text-sm text-slate-600">Add estimators, installers, office staff</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">💰</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Services & Pricing</h3>
                  <p className="text-sm text-slate-600">Configure labor rates and materials</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">📥</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Lead Intake</h3>
                  <p className="text-sm text-slate-600">Control how jobs enter your pipeline</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Product Catalog</h3>
                  <p className="text-sm text-slate-600">Materials, SKUs, suppliers</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🔌</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Integrations</h3>
                  <p className="text-sm text-slate-600">Stripe, email, SMS, etc.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Time Estimate + Completion Confidence */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⏱</span>
            <span className="text-sm">Takes about 5–7 minutes</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔒</span>
            <span className="text-sm">You can edit everything later</span>
          </div>
        </div>
        
        <button
          onClick={() => router.push("/onboarding/2")}
          className="w-full px-6 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg hover:shadow-xl"
        >
          🚀 Build My Workspace
        </button>
        </div>
        
        {/* Right Column - Visual Branding Layer */}
        <div 
          className="hidden lg:block lg:w-2/5 relative"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px),
              linear-gradient(rgba(59, 130, 246, 0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.02) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px, 50px 50px, 10px 10px, 10px 10px',
            backgroundPosition: '0 0, 0 0, 0 0, 0 0'
          }}
        >
          {/* Gradient Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-slate-50/20" />
          
          {/* Optional: Add a subtle logo or icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <div className="text-9xl">🏢</div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
