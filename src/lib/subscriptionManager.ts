/**
 * Subscription Manager
 * Handles loading, creating, and updating user subscriptions from Firestore
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserSubscription } from "@/lib/pricingTiers";
import { TIER_DEFINITIONS } from "@/lib/pricingTiers";
import { isFounder } from "@/lib/auth-utils";

/**
 * Load user's subscription from Firestore
 * Returns the subscription document if it exists, or null if not found
 */
export async function loadUserSubscription(
  userId: string,
  email: string
): Promise<UserSubscription | null> {
  try {
    // If founder, return founder subscription (not stored, generated)
    if (isFounder(email)) {
      return createFounderSubscription(userId);
    }

    // Get user's workspace ID from users collection
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.warn(`User document not found: ${userId}`);
      return null;
    }

    const userData = userDoc.data();
    const workspaceId = userData?.workspaceId;

    if (!workspaceId) {
      console.warn(`User has no workspace: ${userId}`);
      return null;
    }

    // Get workspace to find subscription ID
    const workspaceRef = doc(db, "workspaces", workspaceId);
    const workspaceDoc = await getDoc(workspaceRef);

    if (!workspaceDoc.exists()) {
      console.warn(`Workspace not found: ${workspaceId}`);
      return null;
    }

    const workspaceData = workspaceDoc.data();
    const subscriptionId = workspaceData?.subscriptionId;

    if (!subscriptionId) {
      // No subscription yet - return default Core tier
      return createDefaultSubscription(userId, workspaceId);
    }

    // Load actual subscription document
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      console.warn(`Subscription not found: ${subscriptionId}`);
      return createDefaultSubscription(userId, workspaceId);
    }

    return subscriptionDoc.data() as UserSubscription;
  } catch (error) {
    console.error("Error loading subscription:", error);
    return null;
  }
}

/**
 * Create a new subscription for a user
 * Called when user signs up for the first time
 */
export async function createUserSubscription(
  userId: string,
  workspaceId: string,
  tier: "essentials" | "professional" | "enterprise" | "infrastructure" = "essentials",
  billingCycle: "monthly" | "annual" = "monthly"
): Promise<UserSubscription> {
  const subscriptionId = `sub_${Date.now()}`;
  const tierDef = TIER_DEFINITIONS[tier];

  const subscription: UserSubscription = {
    userId,
    workspaceId,
    tier,
    billingCycle: billingCycle as "monthly" | "annual",
    monthlyAmount: tierDef.monthlyPrice,
    nextBillingDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    currentUserCount: 1,
    seatLimit: tierDef.maxUsers,
    activeAddOns: [],
    status: "trialing", // 7-day trial
    trialEndsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    autoRenew: true,
  };

  try {
    // Save subscription to Firestore
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    await setDoc(subscriptionRef, {
      ...subscription,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update workspace with subscription ID
    const workspaceRef = doc(db, "workspaces", workspaceId);
    await updateDoc(workspaceRef, {
      subscriptionId,
      updatedAt: serverTimestamp(),
    });

    return subscription;
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

/**
 * Update subscription tier
 * Called when user upgrades or downgrades
 */
export async function updateSubscriptionTier(
  subscriptionId: string,
  newTier: "essentials" | "professional" | "enterprise" | "infrastructure",
  billingCycle?: "monthly" | "annual"
): Promise<void> {
  const tierDef = TIER_DEFINITIONS[newTier];

  try {
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);

    const updateData: Record<string, unknown> = {
      tier: newTier,
      monthlyAmount: tierDef.monthlyPrice,
      seatLimit: tierDef.maxUsers,
      updatedAt: serverTimestamp(),
    };

    if (billingCycle) {
      updateData.billingCycle = billingCycle;
    }

    await updateDoc(subscriptionRef, updateData);
  } catch (error) {
    console.error("Error updating subscription tier:", error);
    throw error;
  }
}

/**
 * Add add-on to subscription (e.g., Square Intelligence, extra user packs)
 */
export async function addSubscriptionAddOn(
  subscriptionId: string,
  addOnId: string
): Promise<void> {
  try {
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    const currentAddOns = subscriptionDoc.data().activeAddOns || [];

    if (currentAddOns.includes(addOnId)) {
      console.warn(`Add-on already active: ${addOnId}`);
      return;
    }

    await updateDoc(subscriptionRef, {
      activeAddOns: [...currentAddOns, addOnId],
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding subscription add-on:", error);
    throw error;
  }
}

/**
 * Remove add-on from subscription
 */
export async function removeSubscriptionAddOn(
  subscriptionId: string,
  addOnId: string
): Promise<void> {
  try {
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    const currentAddOns = subscriptionDoc.data().activeAddOns || [];
    const updatedAddOns = currentAddOns.filter((id: string) => id !== addOnId);

    await updateDoc(subscriptionRef, {
      activeAddOns: updatedAddOns,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error removing subscription add-on:", error);
    throw error;
  }
}

/**
 * Update subscription status (active, past_due, canceled, etc.)
 * Called by Stripe webhooks
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: "active" | "trialing" | "past_due" | "canceled",
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (metadata) {
      Object.assign(updateData, metadata);
    }

    await updateDoc(subscriptionRef, updateData);
  } catch (error) {
    console.error("Error updating subscription status:", error);
    throw error;
  }
}

/**
 * Mark subscription as paid (called by Stripe webhook invoice.paid)
 */
export async function markSubscriptionPaid(
  subscriptionId: string,
  nextBillingDate: number
): Promise<void> {
  await updateSubscriptionStatus(subscriptionId, "active", {
    nextBillingDate,
  });
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(
  subscriptionId: string
): Promise<UserSubscription | null> {
  try {
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      return null;
    }

    return subscriptionDoc.data() as UserSubscription;
  } catch (error) {
    console.error("Error getting subscription:", error);
    return null;
  }
}

/**
 * Get all subscriptions for a workspace
 */
export async function getWorkspaceSubscriptions(
  workspaceId: string
): Promise<UserSubscription[]> {
  try {
    const q = query(
      collection(db, "subscriptions"),
      where("workspaceId", "==", workspaceId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as UserSubscription);
  } catch (error) {
    console.error("Error getting workspace subscriptions:", error);
    return [];
  }
}

/**
 * Helper: Create founder subscription (infinite, free)
 */
function createFounderSubscription(userId: string): UserSubscription {
  return {
    userId,
    workspaceId: "founder-workspace",
    tier: "founder",
    billingCycle: "monthly",
    monthlyAmount: 0,
    nextBillingDate: Infinity,
    currentUserCount: Infinity,
    seatLimit: Infinity,
    activeAddOns: [],
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    autoRenew: false,
  };
}

/**
 * Helper: Create default Core subscription
 */
function createDefaultSubscription(
  userId: string,
  workspaceId: string
): UserSubscription {
  const tierDef = TIER_DEFINITIONS["essentials"];
  return {
    userId,
    workspaceId,
    tier: "essentials",
    billingCycle: "monthly",
    monthlyAmount: tierDef.monthlyPrice,
    nextBillingDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    currentUserCount: 1,
    seatLimit: tierDef.maxUsers,
    activeAddOns: [],
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    autoRenew: true,
  };
}
