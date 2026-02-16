export type PlanId = "free" | "starter" | "pro" | "enterprise" | "founder";

export type PlanEntitlements = {
  planId: PlanId;
  seatsIncluded: number;
  installersIncluded: number;
  canUseAI: boolean;
  canSendSMS: boolean;
  canCreateInvoices: boolean;
  canUploadMeasurements: boolean;
  aiCreditsMonthly: number;
  measurementUploadsMonthly: number;
};

export const PLAN_MAP: Record<PlanId, PlanEntitlements> = {
  free: {
    planId: "free",
    seatsIncluded: 1,
    installersIncluded: 0,
    canUseAI: false,
    canSendSMS: false,
    canCreateInvoices: false,
    canUploadMeasurements: false,
    aiCreditsMonthly: 0,
    measurementUploadsMonthly: 0,
  },
  starter: {
    planId: "starter",
    seatsIncluded: 2,
    installersIncluded: 1,
    canUseAI: true,
    canSendSMS: true,
    canCreateInvoices: true,
    canUploadMeasurements: true,
    aiCreditsMonthly: 2000,
    measurementUploadsMonthly: 25,
  },
  pro: {
    planId: "pro",
    seatsIncluded: 5,
    installersIncluded: 3,
    canUseAI: true,
    canSendSMS: true,
    canCreateInvoices: true,
    canUploadMeasurements: true,
    aiCreditsMonthly: 8000,
    measurementUploadsMonthly: 100,
  },
  enterprise: {
    planId: "enterprise",
    seatsIncluded: 20,
    installersIncluded: 10,
    canUseAI: true,
    canSendSMS: true,
    canCreateInvoices: true,
    canUploadMeasurements: true,
    aiCreditsMonthly: 25000,
    measurementUploadsMonthly: 500,
  },
  founder: {
    planId: "founder",
    seatsIncluded: 999,
    installersIncluded: 999,
    canUseAI: true,
    canSendSMS: true,
    canCreateInvoices: true,
    canUploadMeasurements: true,
    aiCreditsMonthly: 999999,
    measurementUploadsMonthly: 999999,
  },
};
