"use client";
import WorkflowStepper from "../../../components/WorkflowStepper";
export default function OrderMaterialsPage() {
  return (
    <div>
      <WorkflowStepper current="Order Materials" />
      <h1 className="text-2xl font-semibold">Order Materials</h1>
    </div>
  );
}