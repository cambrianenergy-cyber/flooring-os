const ALLOWED = new Set([
  "estimator",
  "scheduler",
  "inbox",
  "closer",
  "ops",
  "support",
  "leadScoring",
  "workflow",
]);

/**
 * Converts user-facing strings like:
 *  "Estimator agent" -> "estimator"
 *  "Lead Scoring"    -> "leadScoring"
 *  " lead-scoring "  -> "leadScoring"
 */
export function normalizeAgentType(input: unknown): string | null {
  if (typeof input !== "string") return null;

  const raw = input.trim();
  if (!raw) return null;

  const lowered = raw.toLowerCase();

  // Remove common suffixes/prefixes people type
  const cleaned = lowered
    .replace(/\bagent\b/g, "")
    .replace(/\bai\b/g, "")
    .trim();

  // Collapse separators
  const squashed = cleaned.replace(/[\s_-]+/g, " ");

  // Special cases
  if (squashed === "lead scoring" || squashed === "leadscore" || squashed === "lead scoring agent") {
    return "leadScoring";
  }

  // Direct matches first
  if (ALLOWED.has(squashed)) return squashed;

  // Try removing spaces (e.g. "leadscoring")
  const noSpaces = squashed.replace(/\s+/g, "");
  if (noSpaces === "leadscoring") return "leadScoring";

  // If user typed exactly an allowed camelCase id
  if (ALLOWED.has(raw)) return raw;

  return null;
}

export const allowedAgentTypes = Array.from(ALLOWED);
