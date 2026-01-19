// Schema for Square Scale plan
export interface SquareScalePlan {
  planId: string; // 'square-scale'
  stripePriceId: string; // 'price_1SoFfp2fZwL7ufAuG50a5pFf'
  name: string;
  target: string;
  features: string[];
}

export const SQUARE_SCALE_PLAN: SquareScalePlan = {
  planId: 'square-scale',
  stripePriceId: 'price_1SoFfp2fZwL7ufAuG50a5pFf',
  name: 'Square Scale',
  target: 'Growing teams (up to 5 users)',
  features: [
    '1 workspace',
    'Up to 5 users',
    'AI estimates (assisted)',
    'Job workflows',
    'Material pricing logic',
    'CRM + pipeline',
    'Stripe payments',
    'Basic integrations',
    'No advanced AI agents',
    'No white-label',
    'No multi-location'
  ]
};