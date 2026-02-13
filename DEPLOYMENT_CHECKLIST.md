# Flooring OS Deployment Checklist

## 1. Add Environment Variables

- Add all required Firebase client and admin environment variables to your deployment environment (Vercel, Render, etc).

## 2. Deploy Firestore Indexes

firebase deploy --only firestore:indexes

## 3. Deploy Firestore Security Rules (after schema finalization)

firebase deploy --only firestore:rules

## 4. Deploy Next.js API Routes

- Ensure DocuSign webhook and send-envelope endpoints are deployed.

## 5. Verify Onboarding

- Non-founder users: redirected to Stripe checkout
- Founder users: bypass paywall everywhere (UI + server)

## 6. Test Core Features

- Estimates list
- Appointments list
- Approvals queue
- Confirm no Firestore index errors in the console/logs

---

## One-liner for Firestore Indexes and Rules

firebase deploy --only firestore:indexes,firestore:rules

## Deploy Next.js (Vercel example)

vercel --prod

---

**Remember:**

- Double-check env vars before deploying.
- Run tests and verify all flows after deployment.
