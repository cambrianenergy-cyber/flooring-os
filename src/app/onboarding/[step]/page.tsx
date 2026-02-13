import ClientStep from "./ClientStep";

// This is a server component by default (no 'use client')
export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  return <ClientStep step={step} />;
}
