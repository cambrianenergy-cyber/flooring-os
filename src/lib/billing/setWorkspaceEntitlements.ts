import { FieldValue, getFirestore } from "../firebaseAdmin";
import { PLAN_MAP, PlanId } from "@/lib/billing/planMap";

export async function setWorkspaceEntitlements(params: {
  workspaceId: string;
  planId: PlanId;
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  isFounder?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: number;
}) {
  const db = getFirestore();
  const {
    workspaceId,
    planId,
    status,
    isFounder = false,
    stripeCustomerId,
    stripeSubscriptionId,
    currentPeriodEnd,
  } = params;

  const base = PLAN_MAP[isFounder ? "founder" : planId];

  const ref = db
    .collection("workspaces")
    .doc(workspaceId)
    .collection("entitlements")
    .doc("current");

  const now = Date.now();

  await ref.set(
    {
      workspaceId,
      planId: isFounder ? "founder" : planId,
      status,
      seatsIncluded: base.seatsIncluded,
      installersIncluded: base.installersIncluded,
      canUseAI: base.canUseAI,
      canSendSMS: base.canSendSMS,
      canCreateInvoices: base.canCreateInvoices,
      canUploadMeasurements: base.canUploadMeasurements,
      aiCreditsMonthly: base.aiCreditsMonthly,
      measurementUploadsMonthly: base.measurementUploadsMonthly,
      stripeCustomerId: stripeCustomerId ?? null,
      stripeSubscriptionId: stripeSubscriptionId ?? null,
      currentPeriodEnd: currentPeriodEnd ?? null,
      isFounder: !!isFounder,
      updatedAt: now,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
