export type PlanId = "free" | "starter" | "pro" | "enterprise";

export type Entitlements = {
  canCreateEstimates: boolean;
  canAccessAppointments: boolean;
  canUseAI: boolean;
  canSendDocuSign: boolean;
  maxUsers: number | "unlimited";
};

const PLAN: Record<PlanId, Entitlements> = {
  free: {
    canCreateEstimates: true,
    canAccessAppointments: true,
    canUseAI: false,
    canSendDocuSign: false,
    maxUsers: 1,
  },
  starter: {
    canCreateEstimates: true,
    canAccessAppointments: true,
    canUseAI: true,
    canSendDocuSign: false,
    maxUsers: 3,
  },
  pro: {
    canCreateEstimates: true,
    canAccessAppointments: true,
    canUseAI: true,
    canSendDocuSign: true,
    maxUsers: 15,
  },
  enterprise: {
    canCreateEstimates: true,
    canAccessAppointments: true,
    canUseAI: true,
    canSendDocuSign: true,
    maxUsers: "unlimited",
  },
};

export function resolveEntitlements(args: {
  isFounder: boolean;
  isActive: boolean;
  planId: PlanId;
}): Entitlements {
  if (args.isFounder) {
    return {
      canCreateEstimates: true,
      canAccessAppointments: true,
      canUseAI: true,
      canSendDocuSign: true,
      maxUsers: "unlimited",
    };
  }
  if (!args.isActive) return PLAN.free;
  return PLAN[args.planId] ?? PLAN.free;
}
