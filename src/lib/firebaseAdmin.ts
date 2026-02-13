

import "server-only";
import admin from "firebase-admin";

function getPrivateKey() {
  // Supports either raw key or \n-escaped key
  const key = process.env.FIREBASE_PRIVATE_KEY || "";
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
}

export function getAdminApp() {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin env vars. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return admin.app();
}

export function adminDb() {
  getAdminApp();
  return admin.firestore();
}

export const adminFieldValue = admin.firestore.FieldValue;
export const adminTimestamp = admin.firestore.Timestamp;
