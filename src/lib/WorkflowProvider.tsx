"use client";
import { ReactNode, useEffect, useState } from "react";
import { useFirestoreWorkflow } from "./useFirestoreWorkflow";
import { WorkflowContext, WorkflowState, WorkflowStep } from "./workflow";
import { useWorkspace } from "./workspaceContext";

const defaultState: WorkflowState = {
  currentStep: "Lead",
  completedSteps: [],
};

export function WorkflowProvider({
  children,
  workspaceId: propWorkspaceId,
}: {
  children: ReactNode;
  workspaceId?: string;
}) {
  // Prefer explicit prop, else use workspaceContext
  const { workspace } = useWorkspace();
  const workspaceId = propWorkspaceId || workspace?.id;
  if (!workspaceId)
    throw new Error("Missing workspaceId in WorkflowProvider context");
  const {
    state: firestoreState,
    setState: saveState,
    loading,
  } = useFirestoreWorkflow(workspaceId);
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

  const setStep = (step: WorkflowStep) =>
    setState((s) => ({ ...s, currentStep: step }));
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
