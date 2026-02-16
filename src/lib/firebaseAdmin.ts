import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";

// Only initialize once
if (!getApps().length) {
  initializeApp({
    // You can add credential and projectId here if needed
    // credential: cert(serviceAccount),
    // projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export { getFirestore, FieldValue };
