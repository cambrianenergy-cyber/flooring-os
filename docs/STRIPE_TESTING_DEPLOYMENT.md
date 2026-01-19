# Stripe Integration: Testing & Deployment Guide

## Pre-Testing Checklist

Before you test anything, verify these files exist:

```
src/app/api/billing/
├── checkout/
│   └── route.ts          ✅ CREATE SUBSCRIPTIONS
├── upgrade/
│   └── route.ts          ✅ UPGRADE SUBSCRIPTIONS
└── webhooks/
    └── route.ts          ✅ PROCESS STRIPE EVENTS

src/components/
└── TierUpgrade.tsx       ✅ UPGRADE UI COMPONENT

src/lib/
└── stripe.ts             ✅ STRIPE UTILITIES

docs/
├── STRIPE_COMPLETE_SETUP.md        ✅ FULL DOCUMENTATION
├── STRIPE_QUICK_START.md           ✅ 15-MIN SETUP
└── STRIPE_PRODUCTS_UPGRADE_TESTING.md  ← YOU ARE HERE
```

All files should exist from Phase 11. If any are missing, they were created in this session.

---

## Testing in 5 Stages

### Stage 1: Environment Validation (2 min)

**Verify .env.local is configured:**

```powershell
# Check file contents (Windows PowerShell)
Get-Content -Path "c:\Users\finan\flooring-os\.env.local" | Select-String "STRIPE_"
```

Expected output:
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ESSENTIALS=price_xxx
STRIPE_PRICE_PROFESSIONAL=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx
STRIPE_PRICE_INFRASTRUCTURE=price_xxx
```

**If missing:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy Secret Key, Publishable Key
3. Go to https://dashboard.stripe.com/test/webhooks
4. Create endpoint: `http://localhost:3000/api/billing/webhooks`
5. Copy signing secret
6. Add all values to `.env.local`
7. **Restart dev server** (`npm run dev`)

### Stage 2: API Endpoint Testing (3 min)

**Test checkout endpoint directly:**

```powershell
# Test successful tier request
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/billing/checkout" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    tier = "professional"
    userId = "test-user-123"
    email = "test@example.com"
    workspaceId = "test-workspace-456"
  } | ConvertTo-Json)

# Should see sessionUrl
$response | ConvertTo-Json
```

**Expected Response:**
```json
{
  "success": true,
  "sessionId": "cs_test_abc123",
  "sessionUrl": "https://checkout.stripe.com/pay/cs_test_abc123",
  "priceId": "price_1abc2def3ghi4jkl",
  "tierName": "Square Professional",
  "monthlyPrice": 699
}
```

**If you see `sessionUrl` starting with `https://checkout.stripe.com`:** ✅ Checkout working!

**Test error cases:**

```powershell
# Missing email - should get 400 error
Invoke-RestMethod -Uri "http://localhost:3000/api/billing/checkout" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    tier = "professional"
    userId = "test"
  } | ConvertTo-Json)
```

Should return error about missing fields.

```powershell
# Founder tier - should be rejected
Invoke-RestMethod -Uri "http://localhost:3000/api/billing/checkout" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    tier = "founder"
    userId = "test-user"
    email = "test@example.com"
    workspaceId = "test-workspace"
  } | ConvertTo-Json)
```

Should return error: "Cannot checkout for Founder tier".

### Stage 3: Payment Flow Testing (5 min)

**Simulate a complete payment:**

1. Get session URL from Stage 2:
   ```powershell
   $sessionUrl = $response.sessionUrl
   Write-Host $sessionUrl
   ```

2. Open URL in browser:
   ```powershell
   Start-Process $sessionUrl
   ```

3. You should see Stripe checkout page with:
   - Amount: $699.00
   - Product: Square Professional
   - Email pre-filled

4. **Use Stripe test card:**
   - Number: `4242 4242 4242 4242`
   - Expiry: `12 / 34`
   - CVC: `123`
   - Name: Any name

5. Click **Pay**

6. Should redirect to success page:
   ```
   http://localhost:3000/billing/success?tier=professional&workspace=test-workspace-456
   ```

✅ If redirected to success page: Checkout working!

### Stage 4: Webhook Testing (3 min)

**Verify webhook was received and processed:**

1. Go to Stripe Dashboard:
   - https://dashboard.stripe.com/test/webhooks
   - Click your webhook endpoint

2. Look for **Recent events** section
   - Should see `invoice.paid` event (green checkmark)
   - Status: "Processed"

3. Click the `invoice.paid` event
   - Expand **Request** section
   - Should see metadata with your userId and workspaceId

**Example webhook event:**
```json
{
  "id": "evt_1abc2def3ghi4jkl",
  "type": "invoice.paid",
  "data": {
    "object": {
      "id": "in_1abc2def",
      "customer": "cus_abc123",
      "subscription": "sub_abc123",
      "amount_paid": 69900,
      "status": "paid"
    }
  }
}
```

### Stage 5: Firestore Verification (2 min)

**Check if Firestore was updated:**

1. Go to Firebase Console:
   - https://console.firebase.google.com
   - Select your project
   - Go to Firestore Database

2. Find the workspace document:
   - Collection: `workspaces`
   - Document ID: `test-workspace-456` (from Stage 3)

3. Should see these fields added/updated:
   ```
   stripeCustomerId: "cus_abc123"
   stripeSubscriptionId: "sub_abc123"
   currentTier: "professional"
   subscriptionStatus: "active"
   subscriptionUpdatedAt: 2024-01-15T...
   subscriptionCurrentPeriodEnd: 2024-02-15T...
   ```

✅ If all fields present: Complete flow working!

---

## Upgrade Flow Testing (5 min)

### Prerequisites
- Complete Stage 1-5 above (have an active subscription)
- Know the `stripeSubscriptionId` from Firestore

### Test Upgrade Endpoint

```powershell
# Get subscription ID from Firestore
$subscriptionId = "sub_abc123"  # Replace with real value

# Test upgrade to Enterprise
$upgradeResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/billing/upgrade" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    stripeSubscriptionId = $subscriptionId
    targetTier = "enterprise"
    prorationBehavior = "create_invoice"
  } | ConvertTo-Json)

$upgradeResponse | ConvertTo-Json
```

**Expected Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_abc123",
    "status": "active",
    "currentPeriodEnd": "2024-02-15T00:00:00Z",
    "tier": "enterprise",
    "tierName": "Square Enterprise",
    "monthlyPrice": 1299
  },
  "message": "Successfully upgraded to Square Enterprise"
}
```

### Verify Stripe Update

1. Go to Stripe Dashboard → Customers
2. Find customer with email `test@example.com`
3. Click their subscription
4. Should show:
   - Plan: Square Enterprise ($1,299/mo)
   - Status: Active
   - Metadata updated

### Verify Firestore Update

In Firebase Console, check workspace document:
- `currentTier` should now be `"enterprise"`
- `subscriptionUpdatedAt` should be recent timestamp
- `subscriptionCurrentPeriodEnd` still same (no downgrade)

---

## Error Scenarios & Recovery

### Scenario 1: Invalid Price ID

**Error:** `Stripe price ID not configured for tier: professional`

**Root Cause:** STRIPE_PRICE_PROFESSIONAL not in .env.local

**Fix:**
1. Get real price ID from Stripe Dashboard → Products → Professional
2. Add to .env.local: `STRIPE_PRICE_PROFESSIONAL=price_xxx`
3. Restart dev server
4. Retry Stage 2 test

### Scenario 2: Invalid Webhook Signature

**Error:** `Invalid Stripe signature`

**Root Cause:** STRIPE_WEBHOOK_SECRET mismatch

**Fix:**
1. Go to Stripe Dashboard → Webhooks → Your endpoint
2. Copy the **Signing secret** (click "Reveal")
3. Update .env.local: `STRIPE_WEBHOOK_SECRET=whsec_xxx`
4. Restart dev server
5. Retry payment in Stage 3 (will re-trigger webhook)

### Scenario 3: Subscription Not Found on Upgrade

**Error:** `Subscription not found`

**Root Cause:** stripeSubscriptionId invalid or subscription canceled

**Fix:**
1. Verify subscription ID from Firestore (stripeSubscriptionId field)
2. Check Stripe Dashboard → Customers → Find customer → Check subscription status
3. If subscription is "canceled" or "past_due", must fix status first
4. If subscription doesn't exist, must create new one with Stage 3

### Scenario 4: Webhook Not Processing

**Symptom:** Payment succeeds but Firestore doesn't update

**Debugging:**
1. Check Stripe Dashboard → Webhooks → Your endpoint
   - Look for `invoice.paid` event
   - Click it → Check "Response status"
   - If red X: Webhook failed to process

2. Check your server logs:
   ```powershell
   # Check dev server output for errors
   # Should see: "Processing Stripe webhook: invoice.paid"
   ```

3. Common fixes:
   - Verify STRIPE_WEBHOOK_SECRET correct
   - Verify Firebase credentials correct
   - Check Firestore rules allow writes
   - Restart dev server

### Scenario 5: Firestore Not Updating

**Symptom:** Webhook processed but Firestore unchanged

**Check Firestore Rules:**
```
// Should allow writes to workspaces collection
match /workspaces/{workspaceId} {
  allow read, write: if request.auth.uid != null;
}
```

If rules are more restrictive, webhook might not have permission to write.

**Fix:**
1. Go to Firebase Console → Firestore Rules
2. Ensure webhook can write to subscriptionStatus, currentTier, etc.
3. For local testing, use permissive rules:
   ```
   match /{document=**} {
     allow read, write: if true;
   }
   ```

---

## Performance & Load Testing

### Single User Flow (Current)
- Checkout: ~500ms
- Payment processing: 1-3 seconds
- Webhook execution: ~200ms
- Firestore update: ~100ms
- **Total: ~5 seconds end-to-end**

### Multi-User Testing

To test with multiple concurrent payments:

```powershell
# Create 5 checkout sessions in parallel
1..5 | ForEach-Object {
  $response = Invoke-RestMethod -Uri "http://localhost:3000/api/billing/checkout" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{
      tier = "professional"
      userId = "test-user-$_"
      email = "test$_@example.com"
      workspaceId = "test-workspace-$_"
    } | ConvertTo-Json)
  
  Write-Host "User $_: $($response.sessionUrl)"
}
```

Expected: All 5 should return sessionUrls without errors.

---

## Production Deployment Checklist

Before going live to real customers:

### API Readiness
- [ ] All endpoints tested with Stripe test mode
- [ ] Error handling for all edge cases
- [ ] Logging configured for webhook processing
- [ ] Rate limiting added (optional but recommended)
- [ ] API documentation available for support team

### Stripe Configuration
- [ ] 4 products created in live mode
- [ ] 4 price IDs created in live mode
- [ ] Webhook endpoint configured for live mode
- [ ] Signing secret copied to .env.local (live)
- [ ] API keys updated (sk_live_, pk_live_)

### Database
- [ ] Firestore rules allow webhook to write
- [ ] Firestore indexes created for subscription queries
- [ ] Backup strategy in place
- [ ] Read replicas configured (optional)

### Frontend
- [ ] Checkout buttons integrated in pricing page
- [ ] Upgrade buttons integrated in billing dashboard
- [ ] Error messages user-friendly
- [ ] Success page shows tier confirmation
- [ ] Mobile responsive

### Operations
- [ ] Support team trained on manual refunds
- [ ] Tier downgrade procedure documented
- [ ] Churn handling process defined
- [ ] Analytics dashboard set up
- [ ] Email notifications configured (optional)

### Monitoring
- [ ] Stripe webhook logs monitored daily
- [ ] Failed payments tracked
- [ ] Payment latency monitored
- [ ] Error rate tracked
- [ ] MRR tracked weekly

### Security
- [ ] No secret keys in code (all in .env)
- [ ] Webhook signature verified
- [ ] PCI compliance verified
- [ ] HTTPS enforced (production URL)
- [ ] Sensitive logs not exposed

---

## Go-Live Procedure

### 1. Switch to Stripe Live Mode (2 hours before launch)

```powershell
# Get live keys from Stripe Dashboard
# https://dashboard.stripe.com/apikeys (toggle Test Mode OFF)

# Update .env.local
$env:STRIPE_SECRET_KEY = "sk_live_xxxxx"
$env:STRIPE_PUBLISHABLE_KEY = "pk_live_xxxxx"
$env:STRIPE_WEBHOOK_SECRET = "whsec_xxxxx"  # From live webhook

# Restart app
npm run dev
```

### 2. Test with $1 Charge (30 min before launch)

```powershell
# Create checkout session for Essentials ($299)
# Complete payment with real credit card
# Verify Stripe shows charge in live mode
# Verify Firestore updated with subscription
```

### 3. Deploy to Production (Just before launch)

```powershell
# Deploy to production environment
npm run build
npm run start

# Verify webhook URL updated in Stripe (live mode)
# https://yourdomain.com/api/billing/webhooks
```

### 4. Monitor First Hour

- Watch Stripe Dashboard for failed payments
- Check Firestore for subscription updates
- Monitor app logs for errors
- Be ready to roll back if issues

### 5. After First 24 Hours

- Verify all payments processed correctly
- Analyze conversion rate
- Check for any webhook failures
- Contact early customers for feedback

---

## Monitoring & Analytics

### Daily Checks

```sql
-- How many subscriptions active?
SELECT COUNT(*) as active_subscriptions, SUM(monthlyPrice) as daily_mrr
FROM workspaces
WHERE subscriptionStatus = "active"

-- Any failed payments?
SELECT COUNT(*) as failed_payments
FROM webhooks
WHERE type = "invoice.payment_failed"
AND timestamp > NOW() - INTERVAL 24 HOUR

-- Conversion rate?
SELECT 
  COUNT(DISTINCT stripeCustomerId) as total_customers,
  SUM(CASE WHEN currentTier != "founder" THEN 1 ELSE 0 END) as paying_customers,
  ROUND(100 * SUM(CASE WHEN currentTier != "founder" THEN 1 ELSE 0 END) / 
        COUNT(DISTINCT stripeCustomerId), 2) as conversion_rate
```

### Weekly Reports

Send to leadership:
- MRR (Monthly Recurring Revenue)
- Customer count by tier
- Upgrade rate (how many upgraded from free)
- Churn rate (canceled subscriptions)
- Payment failure rate

---

## Support Runbook

### Customer: "I want to cancel"
1. Find subscription in Stripe Dashboard
2. Click "Cancel at period end" or "Cancel immediately"
3. Firestore will auto-update via webhook

### Customer: "I was overcharged"
1. Find invoice in Stripe Dashboard
2. Click "Refund" button
3. Select refund amount (full or partial)
4. Reason: Customer request
5. Stripe sends refund email automatically

### Customer: "I want to downgrade"
1. Use upgrade endpoint but with lower tier
2. Proration = customer gets credit
3. New tier takes effect immediately

### Customer: "My payment failed"
1. Find failed invoice in Stripe Dashboard
2. Click "Retry payment"
3. Stripe sends payment retry email to customer
4. If fails again, contact customer to update payment method

---

## Success Metrics (Target After 30 Days)

| Metric | Target | Actual |
|--------|--------|--------|
| MRR | $5,000+ | |
| Active Subscriptions | 10+ | |
| Conversion Rate | 20%+ | |
| Payment Success Rate | 99%+ | |
| Webhook Success Rate | 100% | |
| Average Tier | Professional | |
| Churn Rate | <5% | |

---

**Status:** Ready for testing and deployment
**Updated:** Phase 11 - Stripe Products & Upgrade Logic
**Next Step:** Begin Stage 1 (Environment Validation)
