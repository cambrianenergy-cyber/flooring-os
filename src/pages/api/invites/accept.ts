import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { validateWorkspaceInvite, validateWorkspaceMember } from '@/lib/onboarding';

// POST /api/invites/accept
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { tokenHash, uid, name, email } = req.body;
  if (!tokenHash || !uid || !name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const inviteRef = doc(db, `workspace_invites/${tokenHash}`);
  try {
    await runTransaction(db, async (transaction) => {
      const inviteSnap = await transaction.get(inviteRef);
      if (!inviteSnap.exists()) throw new Error('Invite not found');
      const invite = inviteSnap.data();
      if (!validateWorkspaceInvite(invite)) throw new Error('Invalid invite');
      if (invite.status !== 'pending') throw new Error('Invite not pending');
      // Create member
      const member = {
        uid,
        role: invite.role,
        status: 'active',
        email,
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (!validateWorkspaceMember(member)) throw new Error('Invalid member');
      const memberRef = doc(db, `workspaces/${invite.workspaceId}/members/${uid}`);
      transaction.set(memberRef, member);
      // Mark invite accepted
      transaction.update(inviteRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedUid: uid,
      });
    });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept invite', details: String(err) });
  }
}
