# Onboarding Firestore Schema & Collections

## Collections & Documents

- `workspaces/{workspaceId}`
  - Main workspace document (metadata, owner, etc.)

- `workspaces/{workspaceId}/onboarding/state`
  - Single document for onboarding state and progress

## onboarding/state Document Fields
- `progress.currentStep: number`  
  (Current onboarding step)
- `step1`, `step2`, ... or flat fields for form data
- `updatedAt: timestamp`  
  (Set with FieldValue.serverTimestamp())

## Indexes
- No custom indexes required (direct doc reads/writes)

## Example Document
```json
{
  "progress": { "currentStep": 2 },
  "companyName": "Acme Inc.",
  "industry": "flooring",
  "updatedAt": { ".sv": "timestamp" }
}
```
