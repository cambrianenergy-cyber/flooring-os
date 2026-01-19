import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { validateWorkspaceInvite } from '@/lib/onboarding';
import { nanoid } from 'nanoid';

// POST /api/invites/create
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { workspaceId, email, role, invitedByUid } = req.body;
  if (!workspaceId || !email || !role || !invitedByUid) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const tokenHash = nanoid();
  const invite = {
    workspaceId,
    email,
    role,
    invitedByUid,
    tokenHash,
    status: 'pending',
    createdAt: serverTimestamp(),
    expiresAt: null,
    acceptedAt: null,
    acceptedUid: null,
  };
  if (!validateWorkspaceInvite(invite)) {
    return res.status(400).json({ error: 'Invalid invite data' });
  }
  try {
    await setDoc(doc(db, `workspace_invites/${tokenHash}`), invite);
    // TODO: Send email with invite link
    res.status(200).json({ success: true, tokenHash });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invite', details: String(err) });
  }
}
