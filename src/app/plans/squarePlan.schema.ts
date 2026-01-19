// Schema for Square (Solo Contractor) plan
export interface SquarePlan {
  planId: string; // 'square_start'
  stripePriceId: string; // 'square_start_monthly'
  name: string;
  price: string;
  userLimit: number;
  target: string;
  features: string[];
  hardLocks: string[];
}

export const SQUARE_PLAN: SquarePlan = {
  planId: 'square_start',
  stripePriceId: 'square_start_monthly',
  name: 'Square Start',
  price: '$499 / month',
  userLimit: 5,
  target: 'Solo contractors → small crews ready to systemize',
  features: [
    '1 workspace',
    'Up to 5 users',
    'Lead intake system',
    'Estimate builder (manual)',
    'Job tracking (core)',
    'Materials catalog (read-only)',
    'CRM basics',
    'Core reporting dashboard',
    'Standard onboarding + support'
  ],
  hardLocks: [
    'AI automation',
    'Advanced estimate intelligence',
    'Workflow automations',
    'Advanced integrations',
    'Multi-location',
    'White-label',
    'Advanced analytics'
  ]
};