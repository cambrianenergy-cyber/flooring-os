
import path from 'path';
import dotenv from 'dotenv';
// Workaround for __dirname in ES modules (Node.js ESM and ts-node, Windows compatible)
const __filename = decodeURIComponent(new URL(import.meta.url).pathname.replace(/^\//, ''));
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

const MY_UID = process.env.FOUNDER_UID;

async function deleteNonUserWorkspaces() {
  if (!MY_UID) {
    throw new Error("FOUNDER_UID is not set in .env.local");
  }
  const workspacesSnap = await db.collection("workspaces").get();
  const batch = db.batch();
  let deleted = 0;
  workspacesSnap.forEach(doc => {
    if (doc.id !== MY_UID) {
      batch.delete(doc.ref);
      deleted++;
      console.log(`Will delete workspace: ${doc.id}`);
    }
  });
  if (deleted > 0) {
    await batch.commit();
    console.log(`Deleted ${deleted} workspace(s) not matching UID: ${MY_UID}`);
  } else {
    console.log("No non-user workspaces found to delete.");
  }
}

deleteNonUserWorkspaces().catch(err => {
  console.error(err);
  process.exit(1);
});
