"use client";
import WorkflowStepper from "../../../components/WorkflowStepper";
export default function CloseoutPage() {
  return (
    <div>
      <WorkflowStepper current="Closeout" />
      <h1 className="text-2xl font-semibold">Closeout</h1>
    </div>
  );
}
