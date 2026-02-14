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
      <aside className="flex-shrink-0 p-4 bg-white border-r">
        <StepList current={step} />
      </aside>
      <main className="flex-1 flex flex-col p-8">
        <div className="w-full max-w-3xl mx-auto">
          <ProgressBar step={step} />
          {children}
          <div className="flex justify-between items-center mt-8">
            <button
              className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-all font-medium"
              onClick={() => goBack(step, router)}
              disabled={step === 0}
            >
              ← Back
            </button>
            <button
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-bold shadow-md hover:shadow-lg"
              onClick={() => goNext(step, router)}
              disabled={step >= 11}
            >
              Save & Continue →
            </button>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <span>🔒</span>
              <span>Your information is secure and encrypted.</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
