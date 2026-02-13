"use client";
import WorkflowStepper from "../../../components/WorkflowStepper";
import EstimateBuilder from "../../../components/EstimateBuilder";
import { useSearchParams } from "next/navigation";

export default function EstimatePage() {
  const searchParams = useSearchParams();
  let autoFill = null;
  const autoFillParam = searchParams ? searchParams.get("autoFill") : null;
  if (autoFillParam) {
    try {
      autoFill = JSON.parse(autoFillParam);
    } catch {}
  }
  return (
    <div>
      <WorkflowStepper current="Estimate" />
      <h1 className="text-2xl font-semibold mb-4">Estimate</h1>
      <EstimateBuilder autoFill={autoFill} />
    </div>
  );
}
