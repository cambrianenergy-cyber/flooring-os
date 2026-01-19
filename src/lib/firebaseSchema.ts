/**
 * Firestore Schema for Pricing & Subscriptions
 * 
 * This file documents the required Firestore collections and their structure
 * Add these to your Firestore database setup
 */

// ============================================================================
// 1. USERS Collection
// ============================================================================
// Path: /users/{userId}
// Description: User profile with tier information

export interface UserDocument {
  uid: string; // User ID (matches auth.uid)
  email: string;
  displayName: string;

  // Tier information
  tier: "founder" | "essentials" | "professional" | "enterprise" | "infrastructure";
  isFounder: boolean; // Hard-coded for founder emails

  // Workspace reference
  workspaceId: string; // Links to /workspaces/{workspaceId}

  // Timestamps
  createdAt: number; // milliseconds
  updatedAt: number; // milliseconds

  // Optional: User settings
  language?: string;
  timezone?: string;
  preferences?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
}

// Example Firestore document:
// users/user123 {
//   uid: "user123",
//   email: "john@example.com",
//   displayName: "John Doe",
//   tier: "professional",
//   isFounder: false,
//   workspaceId: "workspace123",
//   createdAt: 1703001600000,
//   updatedAt: 1703001600000
// }

// ============================================================================
// 2. WORKSPACES Collection
// ============================================================================
// Path: /workspaces/{workspaceId}
// Description: Company/team workspace with subscription reference

export interface WorkspaceDocument {
  id: string; // Document ID (can be UUID)
  name: string; // Company name

  // Ownership
  ownerId: string; // User ID of workspace owner (links to /users/{ownerId})

  // Subscription reference
  subscriptionId: string; // Links to /subscriptions/{subscriptionId}

  // Team management
  memberIds: string[]; // Array of user IDs
  teamSize: number; // Current count (for quick lookup)

  // Status
  isActive: boolean;
  deletedAt?: number; // Soft delete timestamp

  // Timestamps
  createdAt: number; // milliseconds
  updatedAt: number; // milliseconds
}

// Example Firestore document:
// workspaces/workspace123 {
//   id: "workspace123",
//   name: "Smith Flooring Co",
//   ownerId: "user123",
//   subscriptionId: "sub_1234567890",
//   memberIds: ["user123", "user456", "user789"],
//   teamSize: 3,
//   isActive: true,
//   createdAt: 1703001600000,
//   updatedAt: 1703001600000
// }

// ============================================================================
// 3. SUBSCRIPTIONS Collection
// ============================================================================
// Path: /subscriptions/{subscriptionId}
// Description: Billing subscription with tier, pricing, and status

export interface SubscriptionDocument {
  id: string; // Document ID (matches Stripe subscription ID if using Stripe)
  workspaceId: string; // Links to /workspaces/{workspaceId}
  userId: string; // Admin/owner who manages subscription

  // Tier
  tier: "founder" | "essentials" | "professional" | "enterprise" | "infrastructure";
  billingCycle: "monthly" | "annual";

  // Pricing
  monthlyAmount: number; // USD (base tier price)
  annualAmount?: number; // USD (calculated if annual)
  nextBillingDate: number; // milliseconds (when next charge occurs)

  // Team
  currentUserCount: number; // Current number of team members
  seatLimit: number; // Max users allowed for this tier

  // Add-ons
  activeAddOns: string[]; // Array of add-on IDs (e.g., "square-intelligence-addon")
  // Each add-on has additional monthly cost

  // Billing details
  stripeCustomerId?: string; // Stripe customer ID (if using Stripe)
  stripeSubscriptionId?: string; // Stripe subscription ID
  paymentMethod?: "card" | "invoice" | "bank_transfer";
  lastPaymentDate?: number; // milliseconds

  // Status
  status: "active" | "trialing" | "past_due" | "canceled";
  trialEndsAt?: number; // milliseconds (if status === "trialing")
  canceledAt?: number; // milliseconds (if status === "canceled")
  cancelReason?: string; // Why subscription was canceled

  // Metadata
  createdAt: number; // milliseconds
  updatedAt: number; // milliseconds
  autoRenew: boolean; // Whether to auto-renew after trial

  // Metadata for tracking
  upgradeHistory?: Array<{
    date: number;
    fromTier: string;
    toTier: string;
  }>;
}

// Example Firestore document:
// subscriptions/sub_1234567890 {
//   id: "sub_1234567890",
//   workspaceId: "workspace123",
//   userId: "user123",
//   tier: "professional",
//   billingCycle: "monthly",
//   monthlyAmount: 699,
//   nextBillingDate: 1705593600000,
//   currentUserCount: 3,
//   seatLimit: 15,
//   activeAddOns: ["square-intelligence-addon"],
//   stripeCustomerId: "cus_ABC123",
//   stripeSubscriptionId: "sub_ABC123",
//   paymentMethod: "card",
//   lastPaymentDate: 1703001600000,
//   status: "active",
//   createdAt: 1703001600000,
//   updatedAt: 1703001600000,
//   autoRenew: true,
//   upgradeHistory: [
//     {
//       date: 1703001600000,
//       fromTier: "essentials",
//       toTier: "professional"
//     }
//   ]
// }

// ============================================================================
// 4. FIRESTORE INDEXES (Required for Queries)
// ============================================================================

// Index 1: Query subscriptions by workspace
// Collection: subscriptions
// Fields: workspaceId (Ascending), status (Ascending)
// Status: REQUIRED (for getWorkspaceSubscriptions query)

// Index 2: Query subscriptions by status
// Collection: subscriptions
// Fields: status (Ascending), nextBillingDate (Ascending)
// Status: OPTIONAL (for querying overdue subscriptions)

// Index 3: Query users by workspace
// Collection: users
// Fields: workspaceId (Ascending), tier (Ascending)
// Status: OPTIONAL (for querying team members by tier)

// To create indexes:
// 1. Open Firestore Console → Cloud Firestore
// 2. Go to "Indexes" tab
// 3. Click "Create index"
// 4. Set collection, fields, and sort order
// 5. Click "Create"

// ============================================================================
// 5. FIRESTORE SECURITY RULES
// ============================================================================

// See firestore.rules file for full security rules
// Key points:
// - Users can only read/write their own user document
// - Users can read their workspace document
// - Users can read their workspace's subscription (admins only can write)
// - Founders bypass all rules

// ============================================================================
// 6. INITIALIZATION CODE
// ============================================================================

// When a new user signs up, create documents in this order:
// 1. Create user document in /users/{userId}
// 2. Create workspace document in /workspaces/{workspaceId}
// 3. Create subscription document in /subscriptions/{subscriptionId}
// 4. Update workspace with subscriptionId

// Example using subscriptionManager.ts:
/*
import { createUserSubscription } from "@/lib/subscriptionManager";

// In your signup function:
const subscriptionId = await createUserSubscription(
  userId,
  workspaceId,
  "essentials", // Start with Essentials tier
  "monthly"
);
*/

// ============================================================================
// 7. COMMON QUERIES
// ============================================================================

// Get user's subscription
// SELECT * FROM subscriptions WHERE workspaceId = {userId's workspace}

// Get all active subscriptions
// SELECT * FROM subscriptions WHERE status = "active"

// Get overdue subscriptions
// SELECT * FROM subscriptions WHERE status = "past_due"

// Get subscriptions ending soon
// SELECT * FROM subscriptions WHERE nextBillingDate < (now + 7 days)

// Get team members
// SELECT * FROM users WHERE workspaceId = {workspaceId}

// ============================================================================
// 8. NOTES FOR DEVELOPERS
// ============================================================================

// - Always use serverTimestamp() when creating/updating timestamps
// - Subscription IDs should match Stripe subscription IDs if using Stripe
// - Never expose Stripe keys in client-side code
// - Keep tier definitions in sync with TIER_DEFINITIONS in pricingTiers.ts
// - Add audit logging for subscription changes (for compliance)
// - Implement soft deletes (set deletedAt) rather than hard deletes
