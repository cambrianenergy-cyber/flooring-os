


// Static export stub: server-only code removed
const admin = {};
import fs from 'fs';
const serviceAccount = JSON.parse(fs.readFileSync('./scripts/serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function addMember(workspaceId, uid, role = 'owner') {
  const docId = `${workspaceId}_${uid}`;
  await db.collection('workspace_members').doc(docId).set({
    workspaceId,
    uid,
    status: 'active',
    role,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`Added member ${uid} to workspace ${workspaceId} as ${role}`);
}

// Workspace ID
const workspaceId = 'square-flooring-45b0e'; // Workspace ID (same as project ID in this case)

// UIDs for users
const users = [
  { uid: 'S5mlWvEGqBhK7J1nMSE07wwIlJl1', role: 'owner' }, // Cambrianenergy@gmail.com
  { uid: '7nKvXcEu33cEPhTe3b8qaacMlFr2', role: 'owner' }  // Financialgrowthdfw@gmail.com
];

async function addAllMembers() {
  for (const user of users) {
    await addMember(workspaceId, user.uid, user.role);
  }
  process.exit(0);
}

addAllMembers();
