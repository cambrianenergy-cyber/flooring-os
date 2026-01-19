// Central workflow state management for the flooring app
// This is a simple in-memory store for demo; replace with Firestore or backend for production

export type WorkflowStep =
  | "Lead"
  | "Appointment"
  | "Measure"
  | "Estimate"
  | "Approve"
  | "Order Materials"
  | "Install"
  | "Closeout"
  | "Review"
  | "KPI";

export interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
}

import { createContext, useContext } from "react";

const WorkflowContext = createContext<{
  state: WorkflowState;
  setStep: (step: WorkflowStep) => void;
  completeStep: (step: WorkflowStep) => void;
} | null>(null);


export { WorkflowContext };

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used within WorkflowProvider");
  return ctx;
}

