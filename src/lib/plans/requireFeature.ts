import type { FeatureKey } from "@/lib/plans/featureMatrixV2";

export function requireFeature(
  entitlements: Record<FeatureKey, boolean>,
  feature: FeatureKey
) {
  if (!entitlements[feature]) {
    const err: any = new Error(`Upgrade required: ${feature}`);
    err.status = 402; // Payment Required
    err.feature = feature;
    throw err;
  }
}
