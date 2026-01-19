"use client";
import React, { useState, useEffect, ReactNode } from "react";
import { useFirestoreWorkflow } from "./useFirestoreWorkflow";
import { WorkflowContext, WorkflowState, WorkflowStep } from "./workflow";

const defaultState: WorkflowState = {
  currentStep: "Lead",
  completedSteps: [],
};

// TODO: Replace with real workspaceId from context or props
const workspaceId = "demo-workspace";

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const { state: firestoreState, setState: saveState, loading } = useFirestoreWorkflow(workspaceId);
  const [state, setState] = useState<WorkflowState>(defaultState);

  // Sync Firestore state to local state
  useEffect(() => {
    if (firestoreState) setState(firestoreState);
  }, [firestoreState]);

  // Save to Firestore on local state change
  useEffect(() => {
    if (firestoreState && state !== firestoreState) {
      saveState(state);
    }
  }, [state]);

  const setStep = (step: WorkflowStep) => setState((s) => ({ ...s, currentStep: step }));
  const completeStep = (step: WorkflowStep) =>
    setState((s) => ({
      ...s,
      completedSteps: s.completedSteps.includes(step)
        ? s.completedSteps
        : [...s.completedSteps, step],
    }));

  if (loading) return null;

  return (
    <WorkflowContext.Provider value={{ state, setStep, completeStep }}>
      {children}
    </WorkflowContext.Provider>
  );
}
