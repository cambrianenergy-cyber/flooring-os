/**
 * Set onboarding status and optionally completedAt timestamp.
 * @param status 'not_started' | 'in_progress' | 'complete'
 */
import { updateDoc } from "firebase/firestore";
export async function setOnboardingStatus(status: "not_started" | "in_progress" | "complete") {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const onboardingRef = doc(db, `workspaces/${user.uid}/onboarding/state`);
  const update: any = { status };
  if (status === "complete") {
    update.completedAt = Date.now();
  }
  await updateDoc(onboardingRef, update);
}
// Write an onboarding_events entry for observability
import { setDoc, doc as firestoreDoc } from "firebase/firestore";

/**
 * Log an onboarding event for observability.
 * @param type 'visited' | 'saved' | 'completed' | 'error'
 * @param step Step number
 * @param payload Arbitrary event payload
 * @param uid User ID (optional, defaults to current user)
 */
export async function logOnboardingEvent(type: "visited" | "saved" | "completed" | "error", step: number, payload: Record<string, unknown> = {}, uid?: string) {
  let userId = uid;
  if (!userId) {
    const user = auth.currentUser;
    if (!user) return;
    userId = user.uid;
  }
  const ts = serverTimestamp();
  const eventRef = firestoreDoc(db, `workspaces/${userId}/onboarding_events/${Date.now()}_${Math.floor(Math.random()*10000)}`);
}
// Firestore query helper for services
export function getActiveServices(workspaceId: string) {
  return query(
    collection(db, `workspaces/${workspaceId}/services`),
    where("active", "==", true),
    orderBy("category"),
    orderBy("name")
  );
}
export interface Job {
  jobNumber: string;
  status: "scheduled" | "in_progress" | "completed" | "canceled";
  customerId: string;
  leadId: string | null;
  estimateId: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  schedule: {
    startAt: Timestamp;
    endAt: Timestamp;
  };
  crew: {
    leadUid: string | null;
    memberUids: string[];
  };
  financials: {
    contractTotal: number;
    paidTotal: number;
    balance: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdByUid: string;
}

export function validateJob(data: unknown): data is Job {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<Job>;
  if (typeof d.jobNumber !== "string") return false;
  if (!["scheduled", "in_progress", "completed", "canceled"].includes(d.status as string)) return false;
  if (typeof d.customerId !== "string") return false;
  if (!(typeof d.leadId === "string" || d.leadId === null)) return false;
  if (!(typeof d.estimateId === "string" || d.estimateId === null)) return false;
  if (!d.address || typeof d.address !== "object") return false;
  const a = d.address as Partial<Job["address"]>;
  if (typeof a.street !== "string" || typeof a.city !== "string" || typeof a.state !== "string" || typeof a.zip !== "string") return false;
  if (!d.schedule || typeof d.schedule !== "object") return false;
  const s = d.schedule as Partial<Job["schedule"]>;
  if (!s.startAt || !s.endAt) return false;
  if (!d.crew || typeof d.crew !== "object") return false;
  const c = d.crew as Partial<Job["crew"]>;
  if (!(typeof c.leadUid === "string" || c.leadUid === null)) return false;
  if (!Array.isArray(c.memberUids)) return false;
  if (!d.financials || typeof d.financials !== "object") return false;
  const f = d.financials as Partial<Job["financials"]>;
  if (typeof f.contractTotal !== "number" || typeof f.paidTotal !== "number" || typeof f.balance !== "number") return false;
  if (!d.createdAt || !d.updatedAt) return false;
  if (typeof d.createdByUid !== "string") return false;
  return true;
}
// Firestore query helpers for jobs
export function getScheduledJobs(workspaceId: string) {
  return query(
    collection(db, `workspaces/${workspaceId}/jobs`),
    where("status", "==", "scheduled"),
    orderBy("schedule.startAt", "asc")
  );
}

export function getRecentJobs(workspaceId: string) {
  return query(
    collection(db, `workspaces/${workspaceId}/jobs`),
    orderBy("updatedAt", "desc")
  );
}
import { collection, query, where, orderBy } from "firebase/firestore";
// Firestore query helpers for leads
export function getKanbanLeads(workspaceId: string) {
  return query(
    collection(db, `workspaces/${workspaceId}/leads`),
    where("status", "==", "new"),
    orderBy("createdAt", "desc")
  );
}

export function getMyLeads(workspaceId: string, uid: string) {
  return query(
    collection(db, `workspaces/${workspaceId}/leads`),
    where("assignedToUid", "==", uid),
    orderBy("updatedAt", "desc")
  );
}

export function getStaleLeads(workspaceId: string, status?: string) {
  const leadsRef = collection(db, `workspaces/${workspaceId}/leads`);
  if (status) {
    return query(
      leadsRef,
      where("status", "==", status),
      orderBy("lastActivityAt", "asc")
    );
  }
  return query(
    leadsRef,
    orderBy("lastActivityAt", "asc")
  );
}
import { db, auth } from "@/lib/firebase";
import type { Timestamp } from "firebase/firestore";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";

export async function getCurrentOnboardingStep() {
  const user = auth.currentUser;
  console.log("getCurrentOnboardingStep: user", user);
  if (!user) return 1;
  const onboardingPath = `workspaces/${user.uid}/onboarding/state`;
  console.log("getCurrentOnboardingStep: path", onboardingPath);
  const onboardingRef = doc(db, onboardingPath);
  const snap = await getDoc(onboardingRef);
  if (snap.exists()) {
    return snap.data().currentStep || 1;
  }
  return 1;
}

export async function saveOnboardingStep(step: number, data: unknown) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const onboardingRef = doc(db, `workspaces/${user.uid}/onboarding/state`);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(onboardingRef);
    if (!snap.exists()) {
      transaction.set(onboardingRef, {
        currentStep: step,
        completedSteps: [step],
        data: { [step]: data },
        updatedAt: serverTimestamp(),
      });
    } else {
      const prev = snap.data();
      transaction.update(onboardingRef, {
        currentStep: step,
        completedSteps: Array.from(new Set([...(prev.completedSteps || []), step])),
        [`data.${step}`]: data,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export async function saveOnboardingStepUnified(stepKey: string, stepNumber: number, fields: Record<string, unknown>) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  // workspaceRef not used
  const onboardingRef = doc(db, `workspaces/${user.uid}/onboarding/state`);
  await runTransaction(db, async (transaction) => {
    const onboardingSnap = await transaction.get(onboardingRef);
    let currentStep = stepNumber;
    let completedSteps = [stepNumber];
    let onboardingData = { [stepKey]: fields };
    // Ensure all steps are present in onboardingData
    const stepKeys = [
      "step1", "step2", "step3", "step4", "step5", "step6", "step7", "step8", "step9", "step10", "step11"
    ];
    if (onboardingSnap.exists()) {
      const prev = onboardingSnap.data();
      currentStep = Math.max(prev.currentStep || 1, stepNumber);
      completedSteps = Array.from(new Set([...(prev.completedSteps || []), stepNumber]));
      onboardingData = { ...(prev.data || {}) };
      // Fill missing steps with empty objects
      for (const k of stepKeys) {
        if (!(k in onboardingData)) onboardingData[k] = {};
      }
      onboardingData[stepKey] = fields;
    } else {
      // Fill all steps for new onboarding
      for (const k of stepKeys) {
        onboardingData[k] = {};
      }
      onboardingData[stepKey] = fields;
    }
    transaction.set(onboardingRef, {
      status: "in_progress",
      currentStep,
      completedSteps,
      data: onboardingData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

export async function isOnboardingComplete() {
  const user = auth.currentUser;
  console.log("isOnboardingComplete: user", user);
  if (!user) return false;
  const onboardingPath = `workspaces/${user.uid}/onboarding/state`;
  console.log("isOnboardingComplete: path", onboardingPath);
  const onboardingRef = doc(db, onboardingPath);
  const snap = await getDoc(onboardingRef);
  if (snap.exists()) {
    // Consider onboarding complete if status is 'complete' or a 'complete' field is true
    const data = snap.data();
    return data.status === "complete" || Boolean(data.complete);
  }
  return false;
}


export interface WorkspaceOnboarding {
  status: "not_started" | "in_progress" | "complete";
  currentStep: number;
  completedSteps: number[];
  data: { [key: string]: unknown };
  updatedAt: Timestamp;
  completedAt?: number;
  workspaceId?: string;
}


export interface Workspace {
  name: string;
  ownerUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: "active" | "paused" | "deleted";
  planKey: "square_start" | "square_scale" | "square_pro" | "square_elite";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  billingStatus: "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "none";
  seatLimit: number;
  featureFlags?: { [key: string]: unknown };
  onboarding: WorkspaceOnboarding;
}


export function validateWorkspace(data: unknown): data is Workspace {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<Workspace>;
  if (typeof d.name !== "string" || typeof d.ownerUid !== "string") return false;
  if (!d.createdAt || !d.updatedAt) return false;
  if (!["active", "paused", "deleted"].includes(d.status as string)) return false;
  if (!["square_start", "square_scale", "square_pro", "square_elite"].includes(d.planKey as string)) return false;
  if (!(typeof d.stripeCustomerId === "string" || d.stripeCustomerId === null)) return false;
  if (!(typeof d.stripeSubscriptionId === "string" || d.stripeSubscriptionId === null)) return false;
  if (!(typeof d.stripePriceId === "string" || d.stripePriceId === null)) return false;
  if (!["trialing", "active", "past_due", "canceled", "incomplete", "none"].includes(d.billingStatus as string)) return false;
  if (typeof d.seatLimit !== "number") return false;
  if (!d.onboarding || typeof d.onboarding !== "object") return false;
  const o = d.onboarding as Partial<WorkspaceOnboarding>;
  if (!["not_started", "in_progress", "complete"].includes(o.status as string)) return false;
  if (typeof o.currentStep !== "number" || !Array.isArray(o.completedSteps) || typeof o.data !== "object" || !o.updatedAt) return false;
  return true;
}


export interface WorkspaceMember {
  uid: string;
  role: "founder" | "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited" | "removed";
  email: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export function validateWorkspaceMember(data: unknown): data is WorkspaceMember {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<WorkspaceMember>;
  if (typeof d.uid !== "string") return false;
  if (!["founder", "owner", "admin", "member", "viewer"].includes(d.role as string)) return false;
  if (!["active", "invited", "removed"].includes(d.status as string)) return false;
  if (typeof d.email !== "string" || typeof d.name !== "string") return false;
  if (!d.createdAt || !d.updatedAt) return false;
  return true;
}


export interface WorkspaceInvite {
  workspaceId: string;
  email: string;
  role: string;
  invitedByUid: string;
  tokenHash: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  createdAt: Timestamp;
  expiresAt: Timestamp;
  acceptedAt: Timestamp | null;
  acceptedUid: string | null;
}

export function validateWorkspaceInvite(data: unknown): data is WorkspaceInvite {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<WorkspaceInvite>;
  if (typeof d.workspaceId !== "string") return false;
  if (typeof d.email !== "string") return false;
  if (typeof d.role !== "string") return false;
  if (typeof d.invitedByUid !== "string") return false;
  if (typeof d.tokenHash !== "string") return false;
  if (!["pending", "accepted", "expired", "revoked"].includes(d.status as string)) return false;
  if (!d.createdAt || !d.expiresAt) return false;
  if (!(d.acceptedAt === null || typeof d.acceptedAt !== "undefined")) return false;
  if (!(d.acceptedUid === null || typeof d.acceptedUid === "string")) return false;
  return true;
}

export interface Customer {
  displayName: string;
  phone: string | null;
  email: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdByUid: string;
  nameLower?: string;
  phoneDigits?: string;
  emailLower?: string;
}

export function validateCustomer(data: unknown): data is Customer {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<Customer>;
  if (typeof d.displayName !== "string") return false;
  if (!(typeof d.phone === "string" || d.phone === null)) return false;
  if (!(typeof d.email === "string" || d.email === null)) return false;
  if (!d.address || typeof d.address !== "object") return false;
  const a = d.address as Partial<Customer["address"]>;
  if (typeof a.street !== "string" || typeof a.city !== "string" || typeof a.state !== "string" || typeof a.zip !== "string") return false;
  if (!Array.isArray(d.tags)) return false;
  if (!d.createdAt || !d.updatedAt) return false;
  if (typeof d.createdByUid !== "string") return false;
  // Optional search keys
  if (d.nameLower && typeof d.nameLower !== "string") return false;
  if (d.phoneDigits && typeof d.phoneDigits !== "string") return false;
  if (d.emailLower && typeof d.emailLower !== "string") return false;
  return true;
}


export interface Lead {
  source: "facebook" | "google" | "referral" | string;
  status: "new" | "contacted" | "qualified" | "unqualified" | "won" | "lost";
  priority: "low" | "normal" | "high";
  customerId: string | null;
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  jobAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  notes: string;
  assignedToUid: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActivityAt: Timestamp;
  createdByUid: string;
}

export function validateLead(data: unknown): data is Lead {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<Lead>;
  if (!d.source || typeof d.source !== "string") return false;
  if (!["facebook", "google", "referral", d.source].includes(d.source)) return false;
  if (!["new", "contacted", "qualified", "unqualified", "won", "lost"].includes(d.status as string)) return false;
  if (!["low", "normal", "high"].includes(d.priority as string)) return false;
  if (!(typeof d.customerId === "string" || d.customerId === null)) return false;
  if (!d.contact || typeof d.contact !== "object") return false;
  const c = d.contact as Partial<Lead["contact"]>;
  if (typeof c.name !== "string" || typeof c.phone !== "string" || typeof c.email !== "string") return false;
  if (!d.jobAddress || typeof d.jobAddress !== "object") return false;
  const a = d.jobAddress as Partial<Lead["jobAddress"]>;
  if (typeof a.street !== "string" || typeof a.city !== "string" || typeof a.state !== "string" || typeof a.zip !== "string") return false;
  if (typeof d.notes !== "string") return false;
  if (!(typeof d.assignedToUid === "string" || d.assignedToUid === null)) return false;
  if (!d.createdAt || !d.updatedAt || !d.lastActivityAt) return false;
  if (typeof d.createdByUid !== "string") return false;
  return true;
}
// Generic validator for onboarding step data
export function validateWorkspaceOnboardingStep(stepKey: string, fields: unknown): boolean {
  // Accept any object for now, but you can add per-step validation logic here
  if (!fields || typeof fields !== 'object') return false;
  // Optionally, add stricter checks for known step keys
  return true;
}
