"use client";
import { useRouter } from "next/navigation";
import ProgressBar from "./ProgressBar";
import StepList from "./StepList";

export function goNext(step: number, router: ReturnType<typeof useRouter>) {
  const nextStep = step + 1;
  if (nextStep === 0) {
    router.push("/onboarding/welcome");
  } else if (nextStep <= 11) {
    router.push(`/onboarding/${nextStep}`);
  }
}

export function goBack(step: number, router: ReturnType<typeof useRouter>) {
  const prevStep = Math.max(0, step - 1);
  if (prevStep === 0) {
    router.push("/onboarding/welcome");
  } else {
    router.push(`/onboarding/${prevStep}`);
  }
}

export default function OnboardingLayout({
  children,
  step,
}: {
  children: React.ReactNode;
  step: number;
}) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="flex-shrink-0 w-80 p-6 bg-white border-r border-slate-200">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Setup Progress</h2>
          <p className="text-sm text-slate-600">Complete all steps to launch your workspace</p>
        </div>
        <StepList current={step} />
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 min-h-screen flex flex-col">
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <ProgressBar step={step} />
            {children}
          </div>
        </div>
        
        {/* Navigation Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-8 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <button
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-all font-medium"
                onClick={() => goBack(step, router)}
                disabled={step === 0}
              >
                ← Back
              </button>
              <div className="text-center">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                  <span>🔒</span>
                  <span>Your information is secure and encrypted.</span>
                </p>
              </div>
              <button
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-bold shadow-md hover:shadow-lg"
                onClick={() => goNext(step, router)}
                disabled={step >= 11}
              >
                Save & Continue →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
