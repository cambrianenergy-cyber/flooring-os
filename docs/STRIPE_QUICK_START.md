# Quick Start: Stripe Configuration in 15 Minutes

This is a **copy-paste ready** guide to get Stripe integrated and accepting payments immediately.

## Part 1: Stripe Dashboard Setup (5 minutes)

### Step 1: Get API Keys
1. Go to https://dashboard.stripe.com/apikeys
2. You'll see two rows in "Secret Keys" section:
   - **Secret Key** (starts with `sk_test_` for test mode)
   - **Publishable Key** (starts with `pk_test_` for test mode)
3. Copy both values and save them

### Step 2: Create 4 Products in Stripe

Go to https://dashboard.stripe.com/products and click **Add Product** for each:

#### Product 1: Essentials
```
Name: Square Essentials
Description: The Foundation
Price: $299/month
```
→ Copy the price ID that appears (format: `price_xxx...`)

#### Product 2: Professional
```
Name: Square Professional
Description: The Operating System
Price: $699/month
```
→ Copy the price ID

#### Product 3: Enterprise
```
Name: Square Enterprise
Description: The Replacement
Price: $1,299/month
```
→ Copy the price ID

#### Product 4: Infrastructure
```
Name: Square Infrastructure
Description: Custom Deployment
Price: $2,500/month
```
→ Copy the price ID

### Step 3: Set Up Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add Endpoint**
3. Endpoint URL: 
   ```
   https://yourdomain.com/api/billing/webhooks
   ```
4. Select events:
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add Endpoint**
6. Click the endpoint, then show **Signing Secret**
7. Copy the secret (starts with `whsec_`)

## Part 2: Configure .env.local (3 minutes)

Open `c:\Users\finan\flooring-os\.env.local` and add these lines:

```env
# Stripe API Keys (from Step 1 above)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# Price IDs from Step 2 above (format: price_xxx...)
STRIPE_PRICE_ESSENTIALS=price_1abc2def3ghi4jkl
STRIPE_PRICE_PROFESSIONAL=price_2abc2def3ghi4jkl
STRIPE_PRICE_ENTERPRISE=price_3abc2def3ghi4jkl
STRIPE_PRICE_INFRASTRUCTURE=price_4abc2def3ghi4jkl
```

Save and restart your dev server.

## Part 3: Test the Integration (7 minutes)

### Test Checkout Endpoint

Run this command in PowerShell:

```powershell
$body = @{
    tier = "professional"
    userId = "test-user-1"
    email = "customer@example.com"
    workspaceId = "test-workspace-1"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/billing/checkout" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

Expected response:
```json
{
  "success": true,
  "sessionUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_...",
  "priceId": "price_xxx",
  "tierName": "Square Professional",
  "monthlyPrice": 699
}
```

✅ **If you see `sessionUrl`:** Checkout is working!

### Test with Real Payment

1. Copy the `sessionUrl` from above
2. Open it in a browser (while logged in to Stripe test mode)
3. Use test card: `4242 4242 4242 4242`
4. Expiry: `12/34`, CVC: `123`
5. Complete the payment

### Verify Webhook Processing

In Stripe Dashboard → Developers → Webhooks → [Your Endpoint]:
- Should see green checkmarks for `invoice.paid`
- Click **invoice.paid** event → View full details
- Should see metadata with your userId and workspaceId

Check Firestore:
```
workspaces/{id}
→ stripeSubscriptionId: "sub_xxx"
→ currentTier: "professional"
→ subscriptionStatus: "active"
```

✅ **If Firestore updated:** Webhooks are working!

## Usage Guide

### Adding a Checkout Button (Frontend)

```tsx
// In any React component
import { useState } from "react";

export function TierCheckout() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (tier: string) => {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tier,
        userId: "current-user-id",
        email: "user@example.com",
        workspaceId: "current-workspace-id",
      }),
    });

    const data = await res.json();
    if (data.sessionUrl) {
      window.location.href = data.sessionUrl;
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={() => handleCheckout("essentials")}>
        $299/mo - Essentials
      </button>
      <button onClick={() => handleCheckout("professional")}>
        $699/mo - Professional
      </button>
      <button onClick={() => handleCheckout("enterprise")}>
        $1,299/mo - Enterprise
      </button>
    </div>
  );
}
```

### Adding an Upgrade Button (Frontend)

```tsx
// Use the built-in TierUpgrade component
import { TierUpgrade } from "@/components/TierUpgrade";

export function BillingPanel() {
  return (
    <TierUpgrade
      currentTier="professional"
      stripeSubscriptionId="sub_xxx_from_firestore"
      onUpgradeSuccess={() => {
        // Refresh subscription data
        window.location.reload();
      }}
    />
  );
}
```

## Files Created

| File | Purpose |
|------|---------|
| `src/app/api/billing/checkout/route.ts` | Create new subscriptions |
| `src/app/api/billing/upgrade/route.ts` | Upgrade existing subscriptions |
| `src/app/api/billing/webhooks/route.ts` | Process Stripe events |
| `src/components/TierUpgrade.tsx` | UI component for upgrades |
| `src/lib/stripe.ts` | Stripe utilities (created in previous phase) |
| `docs/STRIPE_COMPLETE_SETUP.md` | Full documentation |

## Testing Checklist

- [ ] API keys in `.env.local`
- [ ] 4 products created in Stripe
- [ ] Price IDs in `.env.local`
- [ ] Webhook endpoint configured
- [ ] Webhook signing secret in `.env.local`
- [ ] `POST /api/billing/checkout` returns `sessionUrl`
- [ ] Payment test completed with test card
- [ ] Webhook event appears in Stripe Dashboard
- [ ] Firestore updated with subscription data
- [ ] Frontend buttons redirect to checkout correctly

## Common Issues & Fixes

### "Stripe price ID not configured"
→ Check `.env.local` has `STRIPE_PRICE_*` variables with correct values
→ Restart dev server

### "Invalid Stripe signature"
→ Verify `STRIPE_WEBHOOK_SECRET` in `.env.local` matches Stripe Dashboard
→ Make sure webhook is using correct endpoint URL

### "Subscription not found"
→ Verify `stripeSubscriptionId` exists in Firestore
→ Check if subscription is still active (not canceled)

### Payment page shows 404
→ Verify `sessionUrl` is correct (should start with `https://checkout.stripe.com`)
→ Check if using right Stripe keys (test vs. live)

## Production Deployment Checklist

When ready to go live:

1. **Switch Stripe to Live Mode**
   - Go to https://dashboard.stripe.com/apikeys
   - Switch toggle from "Test" to "Live"
   - Copy live API keys (start with `sk_live_` and `pk_live_`)

2. **Update .env.local with Live Keys**
   ```env
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx (live mode)
   ```

3. **Update Webhook Endpoint**
   - In Stripe Dashboard, create new webhook for live mode
   - Set endpoint to: `https://yourdomain.com/api/billing/webhooks`
   - Update signing secret in `.env.local`

4. **Test with Real Payment**
   - Use real credit card (small amount like $1)
   - Verify charge appears in Stripe Dashboard
   - Verify Firestore subscription updated
   - Verify customer receives receipt email

5. **Monitor First Week**
   - Check webhook logs daily
   - Monitor customer support for billing issues
   - Verify all tier features working correctly

## Revenue Tracking

After first payments:

```sql
-- Check MRR (Monthly Recurring Revenue)
SELECT 
  currentTier,
  COUNT(*) as customers,
  SUM(monthlyPrice) as tier_mrr
FROM workspaces
WHERE subscriptionStatus = 'active'
GROUP BY currentTier
```

**Expected MRR from first 10 customers:**
- 5 at Essentials ($299) = $1,495
- 3 at Professional ($699) = $2,097
- 2 at Enterprise ($1,299) = $2,598
- **Total: $6,190 MRR** (potential $74K+ ARR)

## Next Steps

1. ✅ Integrate checkout buttons in pricing page
2. ✅ Integrate upgrade buttons in billing dashboard
3. ✅ Monitor webhook logs for issues
4. ✅ Create support documentation for refunds/cancellations
5. ✅ Set up automated billing emails
6. ✅ Track metrics: conversion rate, average tier, churn rate

---

**Duration:** 15 minutes setup + 10 minutes testing = **25 minutes to first payment**

Ready to generate revenue! 🚀
