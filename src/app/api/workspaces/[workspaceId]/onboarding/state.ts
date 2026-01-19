import { NextResponse } from 'next/server';

type OnboardingState = {
  isComplete: boolean;
  currentStep: number;
  updatedAt?: string;
};

const initialOnboardingState: Omit<OnboardingState, 'updatedAt'> = {
  isComplete: false,
  currentStep: 1,
};

// POST /api/workspaces/[workspaceId]/onboarding/state
export async function POST(req: Request) {
  // In a real implementation, you would extract workspaceId from the URL and persist this to your DB
  // Here, we just return the initial state as a mock
  const onboardingState: OnboardingState = {
    ...initialOnboardingState,
    updatedAt: new Date().toISOString(), // Replace with serverTimestamp in real DB
  };
  return NextResponse.json(onboardingState, { status: 201 });
}
