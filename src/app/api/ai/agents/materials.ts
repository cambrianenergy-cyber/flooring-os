// Agent registry for frontend listing
export const materialsAgentMeta = {
  id: 'materials',
  label: 'Materials & Accessories',
  description: 'Generates a material pick list and accessory breakdown for a job.'
};
// src/app/api/ai/agents/materials.ts

import type { Product } from "@/lib/types";

interface MaterialsInput {
  product: Product;
  sqft: number;
  accessories: string[];
  userRole: string;
}

export function materialsAgent({ product, sqft, accessories, userRole }: MaterialsInput) {
  // Permission check: only allow if userRole is allowed
  if (!['rep', 'manager', 'owner'].includes(userRole)) {
    return { error: "You do not have permission to generate material lists." };
  }

  // Example logic: calculate boxes, underlayment, and accessory quantities
  // Use optional chaining and fallback for boxCoverageSqft
  const boxCoverage = typeof product.boxCoverageSqft === 'number' && product.boxCoverageSqft > 0 ? product.boxCoverageSqft : 20; // default 20 sqft/box
  const boxesNeeded = Math.ceil(sqft / boxCoverage);
  const underlaymentRolls = Math.ceil(sqft / 100);
  const accessoryList = accessories?.length ? accessories : ["None selected"];

  return {
    text: `Material Pick List:\n- ${boxesNeeded} boxes of ${product.name}\n- ${underlaymentRolls} rolls underlayment\n- Accessories: ${accessoryList.join(", ")}`,
    actions: [
      { label: "Add to Estimate" },
      { label: "Download Pick List" },
    ],
    materials: {
      boxes: boxesNeeded,
      underlayment: underlaymentRolls,
      accessories: accessoryList,
    },
  };
}
