import StepList from "./StepList";
import ProgressBar from "./ProgressBar";

export default function OnboardingLayout({ children, step }: { children: React.ReactNode; step: number }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex-shrink-0">
        <StepList current={step} />
      </aside>
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <ProgressBar step={step} />
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}
