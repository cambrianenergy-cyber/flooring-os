# Debug Steps for Permission Error

## Try these in order:

### 1. Hard Refresh (Most Common Fix)
- Press `Ctrl + Shift + Delete`
- Select "Cached images and files"
- Click "Clear data"
- Then press `Ctrl + Shift + R` to hard refresh

### 2. Sign Out and Sign Back In
- Go to your browser's DevTools (F12)
- In Console, run: `localStorage.clear(); window.location.reload();`
- This will clear your auth tokens
- Sign in again at `/login`

### 3. Check Console for Specific Error
- Open DevTools (F12) → Console tab
- Look for the full error message that shows which Firestore path is failing
- It will look like: `FirebaseError: Missing or insufficient permissions. (firestore/permission-denied)`
- Copy the full error stack trace

### 4. If still failing, check:
- Are you signed in? Check if there's a user in DevTools → Application → Local Storage
- What page are you on when you see the error?
- Does the error appear immediately or after clicking something?

## Current Firestore Rules Status:
✅ Deployed at: [timestamp of last deploy]
✅ Onboarding paths fully open for workspace owners
✅ Workspace read/create/update allowed for owners
