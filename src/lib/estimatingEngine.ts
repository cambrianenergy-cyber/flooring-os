// src/lib/estimatingEngine.ts
// Core estimating engine for job/room/material pricing

export interface MaterialEstimateInput {
  sqft: number;
  pricePerSqft: number;
  wastePercent?: number; // e.g. 10 for 10%
  overridePrice?: number | null;
}

export function calculateMaterialCost({ sqft, pricePerSqft, wastePercent = 0, overridePrice = null }: MaterialEstimateInput): number {
  const base = sqft * pricePerSqft;
  const waste = base * (wastePercent / 100);
  const total = base + waste;
  return overridePrice != null ? overridePrice : Math.round(total * 100) / 100;
}

export interface LaborEstimateInput {
  sqft: number;
  baseLaborRate: number;
  laborMultiplier?: number; // e.g. 1.2 for 20% more labor
}

export function calculateLaborCost({ sqft, baseLaborRate, laborMultiplier = 1 }: LaborEstimateInput): number {
  return Math.round(sqft * baseLaborRate * laborMultiplier * 100) / 100;
}

export interface RoomEstimateInput {
  room: {
    sqft: number;
    pricePerSqft: number;
    wastePercent?: number;
    overridePrice?: number | null;
    baseLaborRate: number;
    laborMultiplier?: number;
  };
}

export function calculateRoomEstimate({ room }: RoomEstimateInput) {
  const materialCost = calculateMaterialCost({
    sqft: room.sqft,
    pricePerSqft: room.pricePerSqft,
    wastePercent: room.wastePercent,
    overridePrice: room.overridePrice,
  });
  const laborCost = calculateLaborCost({
    sqft: room.sqft,
    baseLaborRate: room.baseLaborRate,
    laborMultiplier: room.laborMultiplier,
  });
  return {
    materialCost,
    laborCost,
    total: Math.round((materialCost + laborCost) * 100) / 100,
  };
}

export interface JobEstimateInput {
  rooms: Array<RoomEstimateInput["room"]>;
}

export function calculateJobEstimate({ rooms }: JobEstimateInput) {
  let materialTotal = 0;
  let laborTotal = 0;
  for (const room of rooms) {
    const { materialCost, laborCost } = calculateRoomEstimate({ room });
    materialTotal += materialCost;
    laborTotal += laborCost;
  }
  return {
    materialTotal: Math.round(materialTotal * 100) / 100,
    laborTotal: Math.round(laborTotal * 100) / 100,
    total: Math.round((materialTotal + laborTotal) * 100) / 100,
  };
}
