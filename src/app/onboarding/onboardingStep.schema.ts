// Schema for onboarding step documents
export interface OnboardingStep {
  stepNumber: number;
  title: string;
  description?: string;
  completed: boolean;
  updatedAt: string;
}