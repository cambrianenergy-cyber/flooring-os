// LeicaDeviceProfile.ts
// Abstraction for Leica DISTO BLE device capabilities

export type LeicaModel =
  | "D1" | "D110" | "D2" | "D2-2" | "D2G" | "D5" | "D510" | "D810" | "S910" | "X1" | "X3" | "X4" | "X6";

export type LeicaFeature = "distance" | "smartRoom" | "p2p";

export interface LeicaProfile {
  model: LeicaModel;
  features: LeicaFeature[];
}

export const LEICA_PROFILES: LeicaProfile[] = [
  { model: "D1", features: ["distance"] },
  { model: "D110", features: ["distance"] },
  { model: "D2", features: ["distance"] },
  { model: "D2-2", features: ["distance", "smartRoom"] },
  { model: "D2G", features: ["distance", "smartRoom"] },
  { model: "D5", features: ["distance", "smartRoom"] },
  { model: "D510", features: ["distance"] },
  { model: "D810", features: ["distance"] },
  { model: "S910", features: ["distance", "p2p"] },
  { model: "X1", features: ["distance"] },
  { model: "X3", features: ["distance", "smartRoom", "p2p"] },
  { model: "X4", features: ["distance", "smartRoom", "p2p"] },
  { model: "X6", features: ["distance", "smartRoom", "p2p"] },
];

export function getLeicaProfile(model: LeicaModel): LeicaProfile | undefined {
  return LEICA_PROFILES.find((p) => p.model === model);
}
