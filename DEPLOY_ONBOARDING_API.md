# Deploy Checklist: Onboarding Step Save API

## 1. API Route
- [x] src/app/api/onboarding/save-step.ts created
- [x] Uses Firebase Admin SDK for auth and Firestore
- [x] Validates input with Zod schema

## 2. Schema
- [x] src/app/api/onboarding/save-step.schema.ts created
- [x] Exports SaveStepSchema and SaveStepInput

## 3. Firestore Rules
- [x] onboarding_intake rules allow only the user to read/write
- [x] Updates blocked if completedAt is set

## 4. Client Integration
- [ ] Client POSTs to /api/onboarding/save-step with currentStep, updatedAt, and data
- [ ] Passes Firebase ID token in Authorization header

## 5. Testing
- [ ] Test onboarding as a new user (should create doc)
- [ ] Test step update (should update currentStep and updatedAt)
- [ ] Test completion (should block further updates)
- [ ] Test security: other users cannot read/write

## 6. Firestore Console
- [ ] onboarding_intake collection appears after first onboarding
- [ ] Docs have correct fields and values

## 7. Production
- [ ] Remove any test rules or open permissions
- [ ] Monitor logs for errors

---

**Ready to deploy!**
