"use client";
import { routeForStep } from "@/lib/onboardingRoutes";
import { useRouter } from "next/navigation";
import ProgressBar from "./ProgressBar";
import StepList from "./StepList";

export function goNext(step: number, router: ReturnType<typeof useRouter>) {
  router.push(routeForStep(step + 1));
}

export function goBack(step: number, router: ReturnType<typeof useRouter>) {
  router.push(routeForStep(Math.max(0, step - 1)));
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
    <div className="flex min-h-screen">
      <aside className="flex-shrink-0">
        <StepList current={step} />
      </aside>
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <ProgressBar step={step} />
        <div className="w-full max-w-2xl">
          {children}
          <div className="flex justify-between mt-8">
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => goBack(step, router)}
              disabled={step === 0}
            >
              Back
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => goNext(step, router)}
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
