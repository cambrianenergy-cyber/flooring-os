import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// --- Core ---
export function workspaceRef(workspaceId: string) {
  return doc(db, "workspaces", workspaceId);
}
export function memberRef(workspaceId: string, uid: string) {
  return doc(db, "workspaces", workspaceId, "members", uid);
}

// --- Workflow ---
export function leadRef(workspaceId: string, leadId: string) {
  return doc(db, "workspaces", workspaceId, "leads", leadId);
}
export function estimateRef(workspaceId: string, estimateId: string) {
  return doc(db, "workspaces", workspaceId, "estimates", estimateId);
}
export function jobRef(workspaceId: string, jobId: string) {
  return doc(db, "workspaces", workspaceId, "jobs", jobId);
}
export function invoiceRef(workspaceId: string, invoiceId: string) {
  return doc(db, "workspaces", workspaceId, "invoices", invoiceId);
}
export function reviewRef(workspaceId: string, reviewId: string) {
  return doc(db, "workspaces", workspaceId, "reviews", reviewId);
}
export function changeOrderRef(workspaceId: string, changeOrderId: string) {
  return doc(db, "workspaces", workspaceId, "change_orders", changeOrderId);
}

// --- Founder-only Essentials ---
export function auditLogRef(workspaceId: string, logId: string) {
  return doc(db, "workspaces", workspaceId, "audit_logs", logId);
}
export function policyRef(workspaceId: string, policyId: string) {
  return doc(db, "workspaces", workspaceId, "policies", policyId);
}
export function integrationRef(workspaceId: string, provider: string) {
  return doc(db, "workspaces", workspaceId, "integrations", provider);
}
export function founderAlertRef(workspaceId: string, alertId: string) {
  return doc(db, "workspaces", workspaceId, "founder_alerts", alertId);
}

// Example: create or update a member
export async function setMemberRole(
  workspaceId: string,
  uid: string,
  role: string,
) {
  await setDoc(memberRef(workspaceId, uid), { role }, { merge: true });
}

// Example: fetch a workspace's policies
export async function getPolicies(workspaceId: string) {
  const col = collection(db, "workspaces", workspaceId, "policies");
  const snap = await getDocs(col);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Add more CRUD helpers as needed for each collection/subcollection

import { serverTimestamp } from "firebase/firestore";

/**
 * Creates default billing and pricing rule documents for a workspace.
 * @param workspaceId The workspace ID
 * @param ruleId The pricing rule ID (default: "default")
 */
export async function createWorkspaceDefaults(
  workspaceId: string,
  ruleId: string = "default",
) {
  // Default billing document
  const billingRef = doc(db, "workspaces", workspaceId, "billing", "default");
  const billingDefault = {
    status: "active",
    plan: "essentials",
    stripeCustomerId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Default pricing rule document (flooring defaults)
  const pricingRuleRef = doc(
    db,
    "workspaces",
    workspaceId,
    "pricingRules",
    ruleId,
  );
  const pricingRuleDefault = {
    name: "Standard Flooring Pricing",
    type: "flooring",
    pricePerSqFt: 3.5,
    minJobTotal: 500,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Write both documents in parallel
  await Promise.all([
    setDoc(billingRef, billingDefault, { merge: true }),
    setDoc(pricingRuleRef, pricingRuleDefault, { merge: true }),
  ]);
}
