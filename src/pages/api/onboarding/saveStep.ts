import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { validateWorkspaceOnboardingStep } from '@/lib/onboarding';

// POST /api/onboarding/saveStep
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { workspaceId, stepKey, stepNumber, fields, uid } = req.body;
  if (!workspaceId || !stepKey || typeof stepNumber !== 'number' || !fields || !uid) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Validate step data (customize as needed)
  if (!validateWorkspaceOnboardingStep(stepKey, fields)) {
    return res.status(400).json({ error: 'Invalid step data' });
  }
  const onboardingRef = doc(db, `workspaces/${workspaceId}/onboarding/state`);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(onboardingRef);
      let currentStep = stepNumber;
      let completedSteps = [stepNumber];
      let onboardingData = { [stepKey]: fields };
      if (snap.exists()) {
        const prev = snap.data();
        // Only allow currentStep to increment
        currentStep = Math.max(prev.currentStep || 1, stepNumber);
        completedSteps = Array.from(new Set([...(prev.completedSteps || []), stepNumber]));
        onboardingData = { ...(prev.data || {}), [stepKey]: fields };
      }
      transaction.set(onboardingRef, {
        status: 'in_progress',
        currentStep,
        completedSteps,
        data: onboardingData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save onboarding step', details: String(err) });
  }
}
