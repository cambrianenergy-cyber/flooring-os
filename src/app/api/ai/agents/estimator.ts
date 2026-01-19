// Agent registry for frontend listing
export const estimatorAgentMeta = {
  id: 'estimator',
  label: 'Estimator',
  description: 'Generates a detailed estimate draft based on measurements, product, and accessories.'
};
// src/app/api/ai/agents/estimator.ts

import type { Product } from "@/lib/types";

interface EstimatorInput {
  sqft: number;
  product: Product;
  accessories: string[];
  laborRate?: number;
  wastePct?: number;
  userRole: string;
}

export function estimatorAgent({ sqft, product, accessories, laborRate = 2.5, wastePct = 10, userRole }: EstimatorInput) {
  // Permission check: only allow if userRole is allowed
  if (!['rep', 'manager', 'owner'].includes(userRole)) {
    return { error: "You do not have permission to generate estimates." };
  }

  // Calculate waste
  const waste = Math.ceil(sqft * (wastePct / 100));
  const totalSqft = sqft + waste;

  // Calculate product cost
  const productCost = totalSqft * (typeof product.costPerSqft === 'number' ? product.costPerSqft : 0);
  // Calculate labor
  const labor = totalSqft * laborRate;
  // Accessories (simple $50 per accessory for demo)
  const accessoriesCost = (accessories?.length || 0) * 50;

  // Flag missing items
  const missing: string[] = [];
  if (!accessories || accessories.length === 0) missing.push("No accessories selected");
  if (!product) missing.push("No product selected");
  if (!sqft) missing.push("No measurement provided");

  // Wire up AI usage metering
  import("@/lib/metering").then(({ recordAiUsage }) => {
    recordAiUsage({
      workspaceId: "system", // Replace with actual workspaceId if available
      uid: null,
      kind: "estimate_suggest",
      tokens: 100, // Estimate for an estimate response
      model: null,
      entityType: "estimate",
      entityId: product?.name || null,
    });
  });

  return {
    text: `Estimate draft:\nProduct: ${product.name}\nSqft: ${sqft} (+${waste} waste)\nAccessories: ${accessories?.join(", ") || "None"}\nLabor: $${labor.toFixed(2)}\nProduct Cost: $${productCost.toFixed(2)}\nAccessories Cost: $${accessoriesCost.toFixed(2)}\nTotal: $${(productCost + labor + accessoriesCost).toFixed(2)}`,
    actions: [
      { label: "Create Estimate Draft" },
      { label: "Add Accessories to Quote" },
    ],
    missing,
  };
}
