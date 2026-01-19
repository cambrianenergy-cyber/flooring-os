// Schema for Square Elite plan
export interface SquareElitePlan {
  planId: string; // 'square_elite'
  stripePriceId: string; // 'square_elite_monthly'
  name: string;
  price: string;
  userLimit: number;
  target: string;
  features: string[];
  hardLocks: string[];
}

export const SQUARE_ELITE_PLAN: SquareElitePlan = {
  planId: 'square_elite',
  stripePriceId: 'square_elite_monthly',
  name: 'Square Elite',
  price: '$1,499 / month',
  userLimit: 25,
  target: 'High-volume, multi-crew operations',
  features: [
    '1 workspace',
    'Up to 25 users',
    'Full AI automation suite',
    'Advanced workflow orchestration',
    'Multi-location support',
    'Executive analytics dashboard',
    'Priority onboarding + support',
    'Early-access features'
  ],
  hardLocks: [
    'Agency / reseller mode (reserved for future expansion)'
  ]
};