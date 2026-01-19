// patternMatchRules.ts
// Utilities for flooring pattern match logic

export type PatternType = 'straight' | 'diagonal' | 'herringbone' | 'custom';

export interface PatternRule {
  type: PatternType;
  minWastePct: number;
  description: string;
}

export const PATTERN_RULES: PatternRule[] = [
  { type: 'straight', minWastePct: 5, description: 'Straight lay, minimal waste.' },
  { type: 'diagonal', minWastePct: 10, description: 'Diagonal lay, more waste due to cuts.' },
  { type: 'herringbone', minWastePct: 12, description: 'Herringbone pattern, higher waste.' },
  { type: 'custom', minWastePct: 15, description: 'Custom pattern, estimate waste as needed.' },
];

export function getPatternRule(type: PatternType): PatternRule | undefined {
  return PATTERN_RULES.find(r => r.type === type);
}
