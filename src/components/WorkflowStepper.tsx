"use client";
import Link from "next/link";
import { useWorkflow } from "../lib/workflow";

const steps = [
  { name: "Lead", path: "/app/leads" },
  { name: "Appointment", path: "/app/schedule" },
  { name: "Measure", path: "/app/measure" },
  { name: "Estimate", path: "/app/estimate" },
  { name: "Approve", path: "/app/estimate" },
  { name: "Order Materials", path: "/app/order-materials" },
  { name: "Install", path: "/app/install" },
  { name: "Closeout", path: "/app/closeout" },
  { name: "Review", path: "/app/review" },
  { name: "KPI", path: "/app/dashboard" },
];

export default function WorkflowStepper({ current }: { current?: string }) {
  const { state, setStep, completeStep } = useWorkflow();
  return (
    <nav className="flex flex-wrap gap-2 my-6 justify-center">
      {steps.map((step, idx) => {
        const isActive = (current || state.currentStep) === step.name;
        const isCompleted = state.completedSteps.includes(step.name as any);
        return (
          <Link
            key={step.name}
            href={step.path}
            onClick={() => setStep(step.name as any)}
          >
            <span
              className={`flex items-center px-4 py-2 rounded-full border text-xs font-semibold shadow transition-all
                ${
                  isActive
                    ? "bg-gradient-to-r from-primary-gradient-from to-primary-gradient-to text-white border-primary-gradient-from"
                    : isCompleted
                      ? "bg-success-muted text-success-foreground border-success"
                      : "bg-background text-blue-600 border-blue-300 hover:bg-blue-50"
                }
              `}
              style={{ minWidth: 90 }}
            >
              {isCompleted && <span className="mr-2 text-green-500">✔</span>}
              {step.name}
              {idx < steps.length - 1 && (
                <span className="mx-2 text-muted">→</span>
              )}
              {isActive && !isCompleted && (
                <button
                  className="ml-2 px-2 py-0.5 rounded bg-green-500 text-white text-[10px] hover:bg-green-600"
                  onClick={(e) => {
                    e.preventDefault();
                    completeStep(step.name as any);
                  }}
                >
                  Mark Done
                </button>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
