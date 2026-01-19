---
title: "Pricing Tier Integration Guide"
subtitle: "How to Wire Up The Square Platform™ Pricing Pyramid"
---

# Pricing Tier Integration Guide

This guide shows how to integrate the pricing tier system into your app, from Firestore schema to React components.

---

## Part 1: Firestore Schema

### Users Collection

Add `tier` data to your user profile:

```typescript
// firestore/users/{userId}
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  
  // Tier info
  tier: "founder" | "essentials" | "professional" | "enterprise" | "infrastructure";
  isFounder: boolean; // Hard-coded for founders
  
  // Current workspace
  workspaceId: string;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}
```

### Workspaces Collection

Add subscription data to workspaces:

```typescript
// firestore/workspaces/{workspaceId}
interface Workspace {
  id: string;
  name: string;
  ownerId: string; // User ID of workspace owner
  
  // Subscription (reference to separate collection)
  subscriptionId: string;
  
  // Team
  memberIds: string[];
  teamSize: number; // Current team size
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}
```

### Subscriptions Collection

Store subscription details separately for easier querying:

```typescript
// firestore/subscriptions/{subscriptionId}
interface SubscriptionRecord {
  id: string;
  workspaceId: string;
  userId: string; // Admin/owner
  
  // Tier
  tier: "founder" | "essentials" | "professional" | "enterprise" | "infrastructure";
  billingCycle: "monthly" | "annual";
  
  // Pricing
  monthlyAmount: number; // USD
  nextBillingDate: number; // timestamp
  
  // Team
  currentUserCount: number;
  seatLimit: number; // From tier
  
  // Add-ons
  activeAddOns: string[]; // Add-on IDs
  
  // Billing
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentMethod?: "card" | "invoice";
  
  // Status
  status: "active" | "trialing" | "past_due" | "canceled";
  trialEndsAt?: number;
  canceledAt?: number;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  autoRenew: boolean;
}
```

### Firestore Indexes

```
Collection: subscriptions
Indexes:
  - workspaceId (Ascending)
  - status (Ascending)
  - nextBillingDate (Ascending)

Collection: users
Indexes:
  - tier (Ascending)
  - workspaceId (Ascending)
```

---

## Part 2: App Initialization

### Load Subscription in Layout

```typescript
// src/app/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TierProvider } from "@/lib/useTier";
import { FeaturesProvider } from "@/lib/deviceDetectionProvider";
import type { UserSubscription } from "@/lib/pricingTiers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscription() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get user's workspace ID
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        if (!userData?.workspaceId) {
          setLoading(false);
          return;
        }

        // Get workspace subscription
        const workspaceRef = doc(db, "workspaces", userData.workspaceId);
        const workspaceDoc = await getDoc(workspaceRef);
        const workspaceData = workspaceDoc.data();

        if (!workspaceData?.subscriptionId) {
          // No subscription? Use default tier
          setSubscription({
            userId: user.uid,
            workspaceId: userData.workspaceId,
            tier: userData.isFounder ? "founder" : "essentials",
            billingCycle: "monthly",
            monthlyAmount: 299,
            nextBillingDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
            currentUserCount: 1,
            seatLimit: 5,
            activeAddOns: [],
            status: "active",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            autoRenew: true,
          });
          setLoading(false);
          return;
        }

        // Load actual subscription
        const subscriptionRef = doc(db, "subscriptions", workspaceData.subscriptionId);
        const subscriptionDoc = await getDoc(subscriptionRef);
        const subscriptionData = subscriptionDoc.data() as UserSubscription;

        setSubscription(subscriptionData || null);
      } catch (error) {
        console.error("Error loading subscription:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>; // or your loading UI
  }

  return (
    <html lang="en">
      <body>
        <TierProvider subscription={subscription}>
          <FeaturesProvider>
            {children}
          </FeaturesProvider>
        </TierProvider>
      </body>
    </html>
  );
}
```

---

## Part 3: Using Tiers in Components

### Check Access with Hook

```typescript
// src/components/RollCutOptimizer.tsx
import { useCanAccessFeature } from "@/lib/useTier";
import { TierGate } from "@/components/TierGate";

export function RollCutOptimizer() {
  return (
    <div>
      <h2>Roll-Cut Optimization</h2>

      <TierGate feature="rollCutOptimizer">
        <div className="p-4 bg-blue-50 rounded-lg">
          {/* This only renders if user has access */}
          <h3 className="font-bold">Optimizing seams...</h3>
          <p>Calculating optimal roll placement for waste reduction.</p>
        </div>
      </TierGate>
    </div>
  );
}
```

### Lock a Button

```typescript
// src/components/EstimateActions.tsx
import { useCanAccessFeature } from "@/lib/useTier";
import { TierLockedButton } from "@/components/TierGate";

export function EstimateActions() {
  const canOptimize = useCanAccessFeature("rollCutOptimizer");

  return (
    <div className="flex gap-2">
      <button className="px-4 py-2 bg-blue-600 text-white rounded">
        Create Estimate
      </button>

      {canOptimize ? (
        <button className="px-4 py-2 bg-green-600 text-white rounded">
          Optimize Cut
        </button>
      ) : (
        <TierLockedButton feature="rollCutOptimizer" />
      )}
    </div>
  );
}
```

### Show Tier Badge

```typescript
// src/components/FeatureTitle.tsx
import { TierBadge } from "@/components/TierGate";

export function FeatureTitle() {
  return (
    <h2 className="flex items-center gap-2">
      Roll-Cut Optimizer
      <TierBadge feature="rollCutOptimizer" />
      {/* Shows "Square Operations+" if user is on Core tier */}
    </h2>
  );
}
```

### Get Billing Info

```typescript
// src/components/SettingsBilling.tsx
import { useBillingInfo, useTeamCapacity } from "@/lib/useTier";

export function BillingSettings() {
  const billing = useBillingInfo();
  const capacity = useTeamCapacity();

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold text-lg">Billing</h3>

      <div className="mt-4 space-y-2 text-sm">
        <p>
          <strong>Current Plan:</strong> {billing.tier}
        </p>
        <p>
          <strong>Monthly Cost:</strong> ${billing.monthlyPrice}
        </p>
        <p>
          <strong>Next Billing:</strong>{" "}
          {new Date(billing.nextBillingDate).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold">Team ({capacity.current}/{capacity.max})</h4>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600"
            style={{ width: `${capacity.percentageUsed}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-600">
          {capacity.slotsRemaining} seats available
        </p>

        {!capacity.hasCapacity && (
          <button className="mt-2 text-blue-600 hover:underline text-sm">
            Add more users
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Part 4: Billing Webhook (Stripe)

### Handle Stripe Events

When Stripe charges a customer, it sends webhooks. Update your subscription status:

```typescript
// pages/api/webhooks/stripe.ts
import { Stripe } from "stripe";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;

    // Update Firestore
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    await updateDoc(subscriptionRef, {
      status: "active",
      nextBillingDate: new Date(invoice.next_payment_attempt! * 1000),
      updatedAt: Date.now(),
    });
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;

    // Mark as past due
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    await updateDoc(subscriptionRef, {
      status: "past_due",
      updatedAt: Date.now(),
    });

    // TODO: Send email notification
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

---

## Part 5: Upgrade Flow

### Upgrade Button

```typescript
// src/components/UpgradeButton.tsx
import { useTier, useTierComparison } from "@/lib/useTier";
import { TierUpgradePrompt } from "@/components/TierGate";
import { useState } from "react";

export function UpgradeButton({ targetTier }: { targetTier: TierLevel }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const { tier } = useTier();

  if (tier === "founder" || tier === targetTier) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowPrompt(true)}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Upgrade to {TIER_DEFINITIONS[targetTier].displayName}
      </button>

      {showPrompt && (
        <UpgradeModal
          targetTier={targetTier}
          onClose={() => setShowPrompt(false)}
          onConfirm={handleUpgrade}
        />
      )}
    </>
  );
}

async function handleUpgrade(targetTier: TierLevel) {
  // Call backend to upgrade
  const response = await fetch("/api/billing/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetTier }),
  });

  if (response.ok) {
    window.location.reload(); // Reload to get new subscription
  }
}
```

### Backend Upgrade Endpoint

```typescript
// pages/api/billing/upgrade.ts
import { auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TIER_DEFINITIONS } from "@/lib/pricingTiers";

export async function POST(req: Request) {
  const { targetTier } = await req.json();
  const user = await auth.currentUser; // Get from auth header in production

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get user's subscription
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  const subscriptionRef = doc(
    db,
    "subscriptions",
    userData.subscriptionId
  );

  const tierDef = TIER_DEFINITIONS[targetTier];

  // Update Stripe subscription (if already on Stripe)
  // Or create new Stripe subscription

  // Update Firestore
  await updateDoc(subscriptionRef, {
    tier: targetTier,
    monthlyAmount: tierDef.monthlyPrice,
    seatLimit: tierDef.maxUsers,
    updatedAt: Date.now(),
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
```

---

## Part 6: Feature Gating Checklist

Before launching a new feature, ask:

- [ ] Which tier gets access? (Core? Operations? Scale+?)
- [ ] Is it gated in `FEATURE_ACCESS` in `pricingTiers.ts`?
- [ ] Does the component use `<TierGate>` or `useCanAccessFeature()`?
- [ ] Is there an "Upgrade" button for locked users?
- [ ] Does the tier badge show which tier is required?
- [ ] Have you tested access on all tier levels?

---

## Part 7: Testing Tiers Locally

### Mock Subscription for Development

```typescript
// src/lib/mockSubscription.ts
import type { UserSubscription } from "@/lib/pricingTiers";

export function createMockSubscription(tier: "essentials" | "professional" | "enterprise" | "infrastructure" = "essentials"): UserSubscription {
  return {
    userId: "test-user",
    workspaceId: "test-workspace",
    tier,
    billingCycle: "monthly",
    monthlyAmount: 299,
    nextBillingDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    currentUserCount: 5,
    seatLimit: 5,
    activeAddOns: [],
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    autoRenew: true,
  };
}
```

### Test in Storybook

```typescript
// src/components/TierGate.stories.tsx
import { StoryObj } from "@storybook/react";
import { TierProvider } from "@/lib/useTier";
import { TierGate } from "@/components/TierGate";
import { createMockSubscription } from "@/lib/mockSubscription";

export default {
  title: "Billing/TierGate",
  component: TierGate,
};

export const LockedFeature: StoryObj = {
  args: {
    feature: "rollCutOptimizer",
    children: <div>Roll-Cut Optimizer</div>,
  },
  render: (args) => (
    <TierProvider subscription={createMockSubscription("essentials")}>
      <TierGate {...args} />
    </TierProvider>
  ),
};

export const UnlockedFeature: StoryObj = {
  args: {
    feature: "rollCutOptimizer",
    children: <div>Roll-Cut Optimizer</div>,
  },
  render: (args) => (
    <TierProvider subscription={createMockSubscription("professional")}>
      <TierGate {...args} />
    </TierProvider>
  ),
};
```

---

## Summary

**File Locations:**
- `src/lib/pricingTiers.ts` — Tier definitions & feature matrix
- `src/lib/useTier.tsx` — React hooks & provider
- `src/components/TierGate.tsx` — Gating components
- `docs/PRICING_PYRAMID.md` — Full documentation

**Key Hooks:**
- `useTier()` — Get current tier info
- `useCanAccessFeature(feature)` — Check access
- `useFeatureUpgrade(feature)` — Get upgrade info
- `useBillingInfo()` — Get billing details

**Key Components:**
- `<TierProvider>` — Wrap app (top-level)
- `<TierGate>` — Lock features with "Upgrade" button
- `<TierLockedButton>` — Disabled button for locked feature
- `<TierBadge>` — Show required tier

You're ready to scale! 🚀
