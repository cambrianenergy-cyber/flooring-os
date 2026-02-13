export const ONBOARDING_STEP_ROUTES: Record<number, string> = {
  0: "/onboarding/0-welcome",
  1: "/onboarding/1-company-profile",
  2: "/onboarding/2-company",
  3: "/onboarding/2-team-roles", // if this is truly a step; otherwise remove
  4: "/onboarding/3-service-area",
  5: "/onboarding/3-stripe-connect",
  6: "/onboarding/4-pricing-settings",
  7: "/onboarding/4-team",
  8: "/onboarding/5-services",
  9: "/onboarding/5-workflow-packs",
  10: "/onboarding/6-ai-assistants",
  11: "/onboarding/6-pricing",
  12: "/onboarding/7-data-import",
  13: "/onboarding/7-leads",
  14: "/onboarding/8-estimates",
  15: "/onboarding/8-security-compliance",
  16: "/onboarding/9-catalog",
  17: "/onboarding/9-review-launch",
};

export const DEFAULT_ONBOARDING_ROUTE = "/onboarding/0-welcome";

export function routeForStep(step: number): string {
  return ONBOARDING_STEP_ROUTES[step] ?? DEFAULT_ONBOARDING_ROUTE;
}
