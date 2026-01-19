interface OnboardingState {
	isComplete?: boolean;
	currentStep?: number;
	[key: string]: any;
}

export function onboardingGuard(onboardingState: OnboardingState | null, pathname: string): string | null {
	if (!onboardingState) return "/onboarding/welcome";

	if (onboardingState.isComplete) {
		return "/dashboard";
	}

	if (!pathname.startsWith("/onboarding")) {
		return `/onboarding/step-${onboardingState.currentStep}`;
	}

	return null;
}
