# Quick Test Commands for Stripe Integration

Copy-paste ready commands to test your payment system immediately.

---

## Prerequisite: Start Dev Server

```powershell
cd "c:\Users\finan\flooring-os"
npm run dev
```

Keep this running in a separate PowerShell window.

---

## Test 1: Environment Validation

**Check if Stripe variables are configured:**

```powershell
# Windows PowerShell
$env:STRIPE_SECRET_KEY
$env:STRIPE_PUBLISHABLE_KEY
$env:STRIPE_WEBHOOK_SECRET
$env:STRIPE_PRICE_PROFESSIONAL
```

**Expected:** All variables should return values (not empty)

If empty, add them to .env.local and restart dev server.

---

## Test 2: Checkout Endpoint - Professional Tier

**Create a checkout session for Professional tier ($699/month):**

```powershell
# PowerShell
$response = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/billing/checkout" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    tier = "professional"
    userId = "user-test-123"
    email = "customer@example.com"
    workspaceId = "workspace-test-456"
  } | ConvertTo-Json)

# Display response
Write-Host "Status: $($response.success)"
Write-Host "Session URL: $($response.sessionUrl)"
Write-Host "Session ID: $($response.sessionId)"
Write-Host "Price ID: $($response.priceId)"
Write-Host "Tier Name: $($response.tierName)"
Write-Host "Monthly Price: $($response.monthlyPrice)"
```

**Expected Response:**
```
Status: True
Session URL: https://checkout.stripe.com/pay/cs_test_xxxxx
Session ID: cs_test_xxxxx
Price ID: price_1abc2def
Tier Name: Square Professional
Monthly Price: 699
```

✅ **If you see sessionUrl:** Checkout endpoint working!

---

## Test 3: Test All Tiers

**Test each tier to verify all price IDs configured:**

```powershell
# Test Essentials ($299)
$essentials = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/billing/checkout" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    tier = "essentials"
    userId = "user-essentials"
    email = "essentials@example.com"
    workspaceId = "workspace-essentials"
  } | ConvertTo-Json)

Write-Host "Essentials: $($essentials.success) - $($essentials.tierName) - $($essentials.monthlyPrice)"

# Test Enterprise ($1,299)
$enterprise = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/billing/checkout" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    tier = "enterprise"
    userId = "user-enterprise"
    email = "enterprise@example.com"
    workspaceId = "workspace-enterprise"
  } | ConvertTo-Json)

Write-Host "Enterprise: $($enterprise.success) - $($enterprise.tierName) - $($enterprise.monthlyPrice)"

# Test Infrastructure ($2,500)
$infra = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/billing/checkout" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    tier = "infrastructure"
    userId = "user-infra"
    email = "infra@example.com"
    workspaceId = "workspace-infra"
  } | ConvertTo-Json)

Write-Host "Infrastructure: $($infra.success) - $($infra.tierName) - $($infra.monthlyPrice)"
```

**Expected:**
```
Essentials: True - Square Essentials - 299
Enterprise: True - Square Enterprise - 1299
Infrastructure: True - Square Infrastructure - 2500
```

✅ **If all 4 tiers return success:** All prices configured!

---

## Test 4: Invalid Tier (Should Fail)

**Try to checkout with Founder tier (should be rejected):**

```powershell
$founderFail = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/billing/checkout" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    tier = "founder"
    userId = "user-founder"
    email = "founder@example.com"
    workspaceId = "workspace-founder"
  } | ConvertTo-Json)

Write-Host "Result: $($founderFail.error)"
```

**Expected:**
```
Result: Cannot checkout for Founder tier (free)
```

✅ **If you see error message:** Tier validation working!

---

## Test 5: Checkout Session in Browser

**Open checkout in browser and complete payment:**

```powershell
# Save the session URL from Test 2
$sessionUrl = "https://checkout.stripe.com/pay/cs_test_xxxxx"

# Open in default browser
Start-Process $sessionUrl
```

**In the browser:**
1. You should see Stripe checkout page
2. Amount: $699.00 (or other tier price)
3. Product: "Square Professional" (or other tier)
4. Email pre-filled
5. Fill in card: `4242 4242 4242 4242`
6. Expiry: `12 / 34`
7. CVC: `123`
8. Name: Any name
9. Click **Pay**
10. Should redirect to: `http://localhost:3000/billing/success?tier=professional&workspace=workspace-test-456`

✅ **If redirected to success page:** Payment processed!

---

## Test 6: Verify Webhook in Stripe Dashboard

After completing payment:

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click your endpoint
3. Look for **Recent Events** section
4. Should see `invoice.paid` event (green checkmark)
5. Click the event
6. Expand **Request** section
7. Should see metadata with your userId and workspaceId

✅ **If you see webhook:** Stripe received event!

---

## Test 7: Check Firestore Update

After webhook processes:

1. Go to https://console.firebase.google.com
2. Select your project
3. Go to Firestore Database
4. Collection: `workspaces`
5. Find document: `workspace-test-456`
6. Check these fields were added:
   - `stripeCustomerId`: "cus_abc123"
   - `stripeSubscriptionId`: "sub_abc123"
   - `currentTier`: "professional"
   - `subscriptionStatus`: "active"
   - `subscriptionUpdatedAt`: recent timestamp

✅ **If fields present:** Webhook processing working!

---

## Test 8: Upgrade Endpoint

**Upgrade from Professional to Enterprise:**

```powershell
# Get subscription ID from Firestore (workspace-test-456 document)
$subscriptionId = "sub_abc123"  # Replace with real value from Firestore

$upgrade = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/billing/upgrade" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    stripeSubscriptionId = $subscriptionId
    targetTier = "enterprise"
    prorationBehavior = "create_invoice"
  } | ConvertTo-Json)

Write-Host "Success: $($upgrade.success)"
Write-Host "New Tier: $($upgrade.subscription.tier)"
Write-Host "New Price: $($upgrade.subscription.monthlyPrice)"
Write-Host "Message: $($upgrade.message)"
```

**Expected Response:**
```
Success: True
New Tier: enterprise
New Price: 1299
Message: Successfully upgraded to Square Enterprise
```

✅ **If upgrade successful:** Upgrade endpoint working!

---

## Test 9: Verify Firestore Updated After Upgrade

After upgrade:

1. Go back to Firebase Console
2. Find workspace document: `workspace-test-456`
3. Check:
   - `currentTier` should now be `"enterprise"` (was "professional")
   - `subscriptionUpdatedAt` should be recent timestamp

✅ **If tier changed:** Upgrade complete!

---

## Test 10: Downgrade (Should Fail Without Admin)

**Try to downgrade from Enterprise to Professional (should fail):**

```powershell
$downgrade = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/billing/upgrade" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    stripeSubscriptionId = $subscriptionId
    targetTier = "professional"
  } | ConvertTo-Json) -ErrorAction SilentlyContinue

Write-Host "Error: $($downgrade.error)"
```

**Expected:**
```
Error: Cannot upgrade to Professional tier from Enterprise tier
```

✅ **If rejected:** Tier hierarchy enforced!

---

## Summary Test Results Table

| Test | Expected | Status |
|------|----------|--------|
| 1. Environment | All vars set | ✅ |
| 2. Professional | sessionUrl returned | ✅ |
| 3. All Tiers | 4/4 success | ✅ |
| 4. Founder Tier | Rejected | ✅ |
| 5. Payment | Redirected to success | ✅ |
| 6. Webhook | Event appears in Stripe | ✅ |
| 7. Firestore | Fields updated | ✅ |
| 8. Upgrade | Enterprise tier set | ✅ |
| 9. Firestore After Upgrade | Tier changed | ✅ |
| 10. Downgrade Block | Rejected | ✅ |

✅ **If all pass:** Your payment system is fully operational!

---

## Troubleshooting

### "Cannot find module 'stripe'"
```powershell
cd "c:\Users\finan\flooring-os"
npm install stripe --save
npm run dev  # Restart dev server
```

### "Stripe price ID not configured"
```
1. Go to https://dashboard.stripe.com/products
2. Create 4 products with prices
3. Copy price IDs to .env.local
4. Restart dev server (npm run dev)
```

### "Invalid Stripe signature"
```
1. Go to https://dashboard.stripe.com/webhooks
2. Find your webhook endpoint
3. Copy signing secret (click Reveal)
4. Add to .env.local: STRIPE_WEBHOOK_SECRET=whsec_xxx
5. Restart dev server
```

### "Firestore not updating"
```
1. Check Firebase rules allow writes
2. Verify Firebase credentials in .env.local
3. Check server logs for errors
4. Retry payment (webhook will re-trigger)
```

---

## Next Steps After Successful Tests

1. ✅ Create 4 products in Stripe live mode
2. ✅ Update .env.local with live price IDs
3. ✅ Update webhook endpoint URL to production
4. ✅ Wire checkout button to pricing page
5. ✅ Wire upgrade button to billing dashboard
6. ✅ Deploy to production
7. ✅ Test with $1 charge (real card)
8. ✅ Go live! 🚀

---

## Support

If tests fail, check:
1. Dev server running (`npm run dev`)
2. Stripe products created in dashboard
3. Price IDs in .env.local
4. Webhook configured in Stripe Dashboard
5. .env.local not in .gitignore

All code is in:
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/upgrade/route.ts`
- `src/app/api/billing/webhooks/route.ts`

Documentation in:
- `docs/STRIPE_QUICK_START.md`
- `docs/STRIPE_COMPLETE_SETUP.md`
- `docs/STRIPE_TESTING_DEPLOYMENT.md`

---

**Time to complete all tests: ~20 minutes**
**Status after completion: Payment system fully operational** ✅
