"use client";
import WorkflowStepper from "../../../components/WorkflowStepper";
export default function InstallPage() {
  return (
    <div>
      <WorkflowStepper current="Install" />
      <h1 className="text-2xl font-semibold">Install</h1>
    </div>
  );
}