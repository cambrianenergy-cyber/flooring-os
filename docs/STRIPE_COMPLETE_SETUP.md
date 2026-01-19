# Stripe Products & Upgrade Logic: Complete Setup Guide

## Overview

This guide documents the complete Stripe integration for Square's tier-based subscription system. It covers:

1. **Stripe Product Setup** - Creating products in Stripe Dashboard
2. **Environment Configuration** - Setting up API keys and price IDs
3. **Checkout Flow** - How customers create new subscriptions
4. **Upgrade Flow** - How existing customers upgrade tiers
5. **Webhook Processing** - How Stripe events update our database
6. **Revenue Tracking** - How to monitor tier adoption and churn

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Square Pricing Tiers                      │
├─────────────────────────────────────────────────────────────┤
│ Essentials    │ Professional │ Enterprise  │ Infrastructure │
│    $299/mo    │   $699/mo    │  $1,299/mo  │  $2,500-5K/mo  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   ┌────────────────┐
                   │  Stripe Setup  │
                   └────────────────┘
                    ↙              ↘
         ┌──────────────────┐  ┌──────────────────┐
         │ 4 Products:      │  │ 4 Price Objects: │
         │ - Essentials     │  │ price_ess_xxx    │
         │ - Professional   │  │ price_prof_yyy   │
         │ - Enterprise     │  │ price_ent_zzz    │
         │ - Infrastructure │  │ price_infra_www  │
         └──────────────────┘  └──────────────────┘
                            ↓
                   ┌────────────────────────┐
                   │ .env.local Variables:  │
                   │ STRIPE_PRICE_ESSENTIALS│
                   │ STRIPE_PRICE_PROFESSIONAL
                   │ STRIPE_PRICE_ENTERPRISE│
                   │ STRIPE_PRICE_INFRASTRUCTURE
                   └────────────────────────┘
                            ↓
         ┌──────────────────────────────────────┐
         │  POST /api/billing/checkout          │
         │  Creates new customer subscriptions  │
         └──────────────────────────────────────┘
                            ↓
         ┌──────────────────────────────────────┐
         │  Stripe Checkout Session             │
         │  - Hosted payment page               │
         │  - Metadata: tier, userId, workspace │
         └──────────────────────────────────────┘
                            ↓
         ┌──────────────────────────────────────┐
         │  Customer Completes Payment          │
         │  - Subscription created in Stripe    │
         │  - Webhook fires: customer.created   │
         └──────────────────────────────────────┘
                            ↓
         ┌──────────────────────────────────────┐
         │  POST /api/billing/webhooks          │
         │  - Verifies signature                │
         │  - Updates Firestore subscription    │
         │  - Tier metadata synchronized        │
         └──────────────────────────────────────┘

                            ↓
         ┌──────────────────────────────────────┐
         │  Customer Upgrades (Next Tier)       │
         │  - Clicks "Upgrade" in dashboard     │
         │  - Frontend: POST /api/billing/upgrade
         └──────────────────────────────────────┘
                            ↓
         ┌──────────────────────────────────────┐
         │  POST /api/billing/upgrade           │
         │  - Updates Stripe subscription       │
         │  - New price takes effect            │
         │  - Prorated invoice created          │
         │  - Webhook: customer.subscription.updated
         └──────────────────────────────────────┘
                            ↓
         ┌──────────────────────────────────────┐
         │  Firestore Tier Updated              │
         │  - Workspace currentTier changed     │
         │  - Feature gates re-evaluated        │
         │  - Analytics event logged            │
         └──────────────────────────────────────┘
```

## Step 1: Create Products in Stripe Dashboard

### 1.1 Access Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Navigate to **Products** (left sidebar)
3. Click **Add Product**

### 1.2 Create Essentials Product

**Basic Information:**
- Name: `Square Essentials`
- Description: `The Foundation - Basic measurement, team management, and estimation tools for growing flooring companies`
- Product ID (optional): `prod_essentials`

**Pricing:**
- Pricing model: **Recurring**
- Price: `$299`
- Billing period: **Monthly**
- Price ID (automatically generated): Copy this value (format: `price_1Abc2Def3Ghi4Jkl`)

**Additional Settings:**
- Tax code: Leave as default or select "Subscription" if applicable
- Click **Save Product**

### 1.3 Create Professional Product

**Basic Information:**
- Name: `Square Professional`
- Description: `The Operating System - Advanced analytics, premium tools, and team coordination for established companies`
- Product ID (optional): `prod_professional`

**Pricing:**
- Pricing model: **Recurring**
- Price: `$699`
- Billing period: **Monthly**
- Copy the generated price ID

### 1.4 Create Enterprise Product

**Basic Information:**
- Name: `Square Enterprise`
- Description: `The Replacement - Full platform, integrations, white-labeling, and priority support for enterprise flooring operations`
- Product ID (optional): `prod_enterprise`

**Pricing:**
- Pricing model: **Recurring**
- Price: `$1,299`
- Billing period: **Monthly**
- Copy the generated price ID

### 1.5 Create Infrastructure Product

**Basic Information:**
- Name: `Square Infrastructure`
- Description: `Custom deployment, dedicated infrastructure, SLA guarantees, and unlimited teams for the largest operations`
- Product ID (optional): `prod_infrastructure`

**Pricing:**
- Pricing model: **Recurring**
- Price: `$2,500` (or custom)
- Billing period: **Monthly**
- Copy the generated price ID

### Result

You should now have 4 products in Stripe, each with a price object. Each price object has an ID like `price_1abc2def3ghi4jkl`.

## Step 2: Configure Environment Variables

Update `.env.local` with your Stripe keys and price IDs:

```env
# Stripe API Keys (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Price IDs from Step 1 above
STRIPE_PRICE_ESSENTIALS=price_1abc2def3ghi4jkl
STRIPE_PRICE_PROFESSIONAL=price_2abc2def3ghi4jkl
STRIPE_PRICE_ENTERPRISE=price_3abc2def3ghi4jkl
STRIPE_PRICE_INFRASTRUCTURE=price_4abc2def3ghi4jkl
```

**How to find these values:**

1. **API Keys:**
   - Go to https://dashboard.stripe.com/apikeys
   - Copy Secret Key (starts with `sk_test_` or `sk_live_`)
   - Copy Publishable Key (starts with `pk_test_` or `pk_live_`)

2. **Webhook Secret:**
   - Go to https://dashboard.stripe.com/webhooks
   - Click **Add Endpoint** (if not already configured)
   - Set endpoint URL to: `https://yourdomain.com/api/billing/webhooks`
   - Select events: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret

3. **Price IDs:**
   - Go to https://dashboard.stripe.com/products
   - Click each product (Essentials, Professional, etc.)
   - Scroll to pricing section
   - Copy the price ID (e.g., `price_1abc2def3ghi4jkl`)

## Step 3: Frontend Integration

### 3.1 Add Checkout Button

```tsx
// components/CheckoutButton.tsx
import { useState } from "react";

interface CheckoutButtonProps {
  tier: "essentials" | "professional" | "enterprise" | "infrastructure";
  userId: string;
  email: string;
  workspaceId: string;
}

export function CheckoutButton({
  tier,
  userId,
  email,
  workspaceId,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          userId,
          email,
          workspaceId,
          isUpgrade: false,
        }),
      });

      const data = await response.json();

      if (data.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.sessionUrl;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Loading..." : "Get Started"}
    </button>
  );
}
```

### 3.2 Add Upgrade Component

```tsx
// Use the built-in TierUpgrade component
import { TierUpgrade } from "@/components/TierUpgrade";

export function BillingPanel({ tier, stripeSubscriptionId }) {
  return (
    <div>
      <h2>Current Plan: {tier}</h2>
      <TierUpgrade
        currentTier={tier}
        stripeSubscriptionId={stripeSubscriptionId}
        onUpgradeSuccess={() => {
          // Refresh subscription data, show success message
        }}
      />
    </div>
  );
}
```

## Step 4: How Each Endpoint Works

### 4.1 POST /api/billing/checkout

**Purpose:** Create a new customer subscription or upgrade an existing one

**Request:**
```json
{
  "tier": "professional",
  "userId": "user123",
  "email": "customer@example.com",
  "workspaceId": "workspace456",
  "isUpgrade": false,
  "promoCode": "LAUNCH_SPECIAL_20" // optional
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_test_xxxxx",
  "sessionUrl": "https://checkout.stripe.com/...",
  "priceId": "price_1abc2def",
  "tierName": "Square Professional",
  "monthlyPrice": 699
}
```

**Flow:**
1. Validate inputs (tier, email, userId, workspaceId)
2. Look up price ID from environment (STRIPE_PRICE_PROFESSIONAL)
3. Create Stripe Checkout Session with metadata:
   - `userId`: For linking to our user
   - `workspaceId`: For workspace assignment
   - `tier`: For tier tracking
   - `isUpgrade`: true/false for analytics
4. Return checkout URL (customer visits this to pay)

### 4.2 POST /api/billing/upgrade

**Purpose:** Upgrade an existing subscription to a higher tier

**Request:**
```json
{
  "stripeSubscriptionId": "sub_123abc",
  "targetTier": "enterprise",
  "prorationBehavior": "create_invoice"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123abc",
    "status": "active",
    "currentPeriodEnd": "2024-02-15T00:00:00Z",
    "tier": "enterprise",
    "tierName": "Square Enterprise",
    "monthlyPrice": 1299
  },
  "message": "Successfully upgraded to Square Enterprise"
}
```

**Flow:**
1. Verify subscription exists and is in valid state
2. Look up new price ID (STRIPE_PRICE_ENTERPRISE)
3. Update subscription in Stripe:
   - Swap to new price
   - Apply proration (credit difference if downgrading)
   - Generate invoice for additional charges
4. Update metadata with upgrade timestamp
5. Firestore webhook will sync tier change

### 4.3 POST /api/billing/webhooks

**Purpose:** Process Stripe events and update Firestore

**Events Processed:**

| Event | Action |
|-------|--------|
| `invoice.paid` | Mark subscription as `active` |
| `invoice.payment_failed` | Mark subscription as `payment_failed` |
| `customer.subscription.updated` | Update tier from metadata, update period end |
| `customer.subscription.deleted` | Mark subscription as `canceled`, reset to `essentials` |

**Flow:**
1. Verify Stripe signature (prevents spoofed webhooks)
2. Extract event type and data
3. Find workspace by Stripe customer ID
4. Update Firestore with subscription changes
5. Tier change triggers feature gate re-evaluation

## Step 5: Stripe Event Flow

### New Customer Signup

```
1. User clicks "Get Started" → "Professional" → $699/month
2. POST /api/billing/checkout
   - Creates Stripe Checkout Session
   - Metadata: { userId, workspaceId, tier: "professional" }
   - Returns checkout URL

3. User clicks checkout URL
   - Stripe's hosted payment page
   - Enters credit card

4. User completes payment
   - Stripe creates customer and subscription
   - Fires webhook: customer.subscription.created (not tracked yet)
   - Fires webhook: invoice.paid

5. POST /api/billing/webhooks (invoice.paid)
   - Verifies signature
   - Finds workspace by customer ID
   - Updates Firestore:
     - subscriptionStatus: "active"
     - subscriptionUpdatedAt: now
   - ✅ Billing dashboard now shows "Professional" tier

6. Feature gates re-evaluated
   - Components check tier → access 23 advanced features
   - Premium analytics, team tools, installation features enabled
```

### Upgrade from Professional to Enterprise

```
1. User in billing dashboard
   - Current: Professional ($699/mo)
   - Sees: Enterprise option (+$600/mo = $33/day pro-rata)

2. User clicks "Upgrade to Enterprise"
   - TierUpgrade component calls:
   - POST /api/billing/upgrade
   - Body: { stripeSubscriptionId, targetTier: "enterprise" }

3. Backend processes upgrade
   - Validates subscription is active
   - Updates Stripe subscription:
     - Swap price: professional → enterprise
     - Proration: Stripe credits pro-rata amount, bills difference
     - Creates invoice for upgrade charge

4. Stripe fires: customer.subscription.updated
5. POST /api/billing/webhooks
   - Updates Firestore:
     - currentTier: "enterprise"
     - subscriptionStatus: "active"
     - subscriptionUpdatedAt: now

6. User's dashboard refreshes
   - Tier changed to Enterprise
   - $1,299/mo now visible
   - New enterprise features now available
```

### Failed Payment

```
1. Invoice due (monthly renewal)
2. Stripe charges card
3. Card declined / insufficient funds
4. Stripe fires: invoice.payment_failed
5. POST /api/billing/webhooks
   - Updates Firestore: subscriptionStatus: "payment_failed"
   - Feature gates restricted (can downgrade tier or retry)
6. User receives email from Stripe
7. Billing dashboard shows warning
8. User can:
   - Update payment method
   - Downgrade tier
   - Cancel subscription
```

### Subscription Cancellation

```
1. User cancels in billing dashboard or Stripe
2. Stripe fires: customer.subscription.deleted
3. POST /api/billing/webhooks
   - Updates Firestore:
     - subscriptionStatus: "canceled"
     - currentTier: "essentials" (free tier)
4. User loses premium features
5. Can sign up again anytime
```

## Step 6: Testing Checklist

### Prerequisites
- [ ] Stripe account created (test mode)
- [ ] 4 products created in Stripe
- [ ] Price IDs copied to .env.local
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] API keys added to .env.local

### Local Testing

1. **Test Checkout Endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/billing/checkout \
     -H "Content-Type: application/json" \
     -d '{
       "tier": "professional",
       "userId": "test-user-1",
       "email": "test@example.com",
       "workspaceId": "test-workspace-1"
     }'
   ```
   - Should return: `sessionUrl` (starting with https://checkout.stripe.com)

2. **Test with Stripe Test Card**
   - Use card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - Complete payment in Stripe checkout

3. **Verify Webhook**
   - Use Stripe CLI (local testing):
     ```bash
     stripe listen --forward-to localhost:3000/api/billing/webhooks
     ```
   - Check Firestore for updated subscription

4. **Test Upgrade Endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/billing/upgrade \
     -H "Content-Type: application/json" \
     -d '{
       "stripeSubscriptionId": "sub_xxx",
       "targetTier": "enterprise"
     }'
   ```
   - Should return: updated subscription with enterprise tier

### Production Pre-Launch Checklist

- [ ] Switch to Stripe live mode (replace test keys with live keys)
- [ ] Add webhook endpoint URL to Stripe (live mode)
- [ ] Test with small customer first (upgrade, payment)
- [ ] Monitor webhook logs for 24 hours
- [ ] Verify Firestore updates match Stripe events
- [ ] Test payment failure scenario
- [ ] Test cancellation scenario
- [ ] Train support team on subscription management

## Step 7: Analytics & Revenue Tracking

### Key Metrics

```sql
-- Customers by tier (Firestore)
SELECT currentTier, COUNT(*) as count, SUM(monthlyPrice) as MRR
FROM workspaces
WHERE subscriptionStatus = "active"
GROUP BY currentTier

-- Upgrade funnel
SELECT 
  CASE WHEN tier = "essentials" THEN "Essentials"
       WHEN tier = "professional" THEN "Professional"
       WHEN tier = "enterprise" THEN "Enterprise"
       WHEN tier = "infrastructure" THEN "Infrastructure"
  END as tier,
  COUNT(*) as total,
  SUM(CASE WHEN upgraded THEN 1 ELSE 0 END) as upgrades,
  ROUND(100.0 * SUM(CASE WHEN upgraded THEN 1 ELSE 0 END) / COUNT(*), 2) as upgrade_rate
FROM subscriptions
GROUP BY tier

-- Monthly Recurring Revenue (MRR)
SELECT 
  DATE_TRUNC(subscriptionUpdatedAt, MONTH) as month,
  SUM(monthlyPrice) as MRR,
  COUNT(*) as customers
FROM workspaces
WHERE subscriptionStatus = "active"
GROUP BY month
ORDER BY month DESC
```

### Stripe Dashboard Reports

1. **Revenue Dashboard**
   - https://dashboard.stripe.com/reporting/balance/overview
   - See total MRR, upcoming invoices, revenue by product

2. **Customer List**
   - https://dashboard.stripe.com/customers
   - View individual customer subscriptions, payment history

3. **Subscription Analytics**
   - Churn by tier
   - Upgrade rates
   - Average customer lifetime value

## Troubleshooting

### Checkout Session Not Created

**Problem:** `Stripe price ID not configured for tier`

**Solution:**
1. Check `.env.local` has `STRIPE_PRICE_*` variables
2. Verify values match Stripe price IDs (format: `price_xxx`)
3. Restart dev server to reload env vars
4. Check Stripe Dashboard → Products → Pricing for correct IDs

### Webhook Not Processing

**Problem:** Firestore not updating after payment

**Solution:**
1. Verify webhook endpoint URL in Stripe Dashboard:
   - Test mode: `https://yourdomain.com/api/billing/webhooks`
2. Check webhook signing secret in `.env.local` (STRIPE_WEBHOOK_SECRET)
3. View webhook logs in Stripe Dashboard → Developers → Webhooks
4. Verify Firestore rules allow updates to subscription fields

### Subscription Not Found on Upgrade

**Problem:** `Subscription not found` error when upgrading

**Solution:**
1. Verify `stripeSubscriptionId` is correct
   - Find in Firestore: `workspaces/{id}/stripeSubscriptionId`
   - Or in Stripe Dashboard → Customers → Subscriptions
2. Verify subscription is active (not canceled)
3. Check Stripe Dashboard logs for errors

### Feature Gates Not Triggering

**Problem:** User upgraded but features still locked

**Solution:**
1. Verify Firestore `currentTier` field was updated by webhook
2. Restart app or manually refresh subscription in TierProvider
3. Check feature mapping in `src/lib/pricingTiers.ts` → `FEATURE_ACCESS`
4. Verify component uses `TierGate` wrapper for feature gating

## Security Checklist

- [ ] Webhook signature verified (not skipped)
- [ ] STRIPE_SECRET_KEY never exposed to frontend (server-side only)
- [ ] STRIPE_PUBLISHABLE_KEY safe for frontend exposure
- [ ] Webhook endpoint requires POST (not GET)
- [ ] Price IDs validated before Stripe API calls
- [ ] User ID validation before Firestore updates
- [ ] Rate limiting on /api/billing endpoints (optional)
- [ ] All Stripe API errors logged securely
- [ ] PCI compliance (never store full card numbers)

## Revenue Projections

Based on tier adoption, Square can achieve:

### Conservative Scenario (15% Penetration)
- 300 customers (out of 2,000 addressable)
- Mix: 50% Essentials, 30% Professional, 15% Enterprise, 5% Infrastructure
- MRR: ~$200K
- ARR: ~$2.4M

### Growth Scenario (40% Penetration)
- 800 customers
- Mix: 40% Essentials, 35% Professional, 20% Enterprise, 5% Infrastructure
- MRR: ~$600K
- ARR: ~$7.2M

### Enterprise Scenario (60% Penetration + Upsell)
- 1,200 customers
- Higher mix of enterprise/infrastructure (30% Enterprise, 15% Infrastructure)
- MRR: ~$1.2M
- ARR: ~$14.4M

### Key Drivers
- SMB adoption (100-300 install crews) → Essentials
- Mid-market growth (300-1000 crews) → Professional
- Enterprise deployment (1000+ crews) → Enterprise
- White-label / custom → Infrastructure

## Next Steps After Setup

1. **A/B Test Pricing**
   - Test different price points ($199, $299, $399, etc.)
   - Track conversion rate by tier
   - Optimize based on data

2. **Add Promo Codes**
   - Create Stripe coupons for launch offers
   - Pass `promoCode` parameter in checkout

3. **Feature Packaging**
   - Ensure all 23 features properly gated by tier
   - Document which features unlock at each tier
   - Train sales team on tier capabilities

4. **Automated Emails**
   - Welcome email after signup
   - 7-day trial reminder (if applicable)
   - Upgrade upsell email (after 30 days at Essentials)
   - Payment failure notification
   - Renewal reminder

5. **Analytics Dashboard**
   - Real-time MRR
   - Customer acquisition cost (CAC)
   - Lifetime value (LTV)
   - Churn rate by tier
   - Upgrade funnels

6. **Support Workflow**
   - Document how to manually create subscriptions
   - Refund process for failed charges
   - Tier downgrade procedure
   - Customer communication templates

---

**Created:** Phase 11 - Stripe Products & Upgrade Logic Deep Work
**Updated:** Latest session
**Status:** Complete - Ready for production deployment
