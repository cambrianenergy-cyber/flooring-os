// Schema for Square Pro plan
export interface SquareProPlan {
  planId: string; // 'square_pro'
  stripePriceId: string; // 'square_pro_monthly'
  name: string;
  price: string;
  userLimit: number;
  target: string;
  features: string[];
  hardLocks: string[];
}

export const SQUARE_PRO_PLAN: SquareProPlan = {
  planId: 'square_pro',
  stripePriceId: 'square_pro_monthly',
  name: 'Square Pro',
  price: '$999 / month',
  userLimit: 15,
  target: 'Established flooring companies operating at scale',
  features: [
    '1 workspace',
    'Up to 15 users',
    'Advanced estimate intelligence',
    'AI assistants (production-level)',
    'Workflow automation',
    'Integrations hub',
    'Advanced job & revenue analytics',
    'Role-based permissions',
    'Priority support'
  ],
  hardLocks: [
    'Multi-workspace',
    'White-label',
    'Franchise / agency control'
  ]
};