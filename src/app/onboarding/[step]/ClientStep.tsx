"use client";
import dynamic from "next/dynamic";

interface ClientStepProps {
  step: string;
}

export default function ClientStep({ step }: ClientStepProps) {
  const StepComponent = dynamic(() => import(`../${step}/page`), {
    ssr: false,
    loading: () => <div>Loading...</div>,
  });
  return <StepComponent />;
}
