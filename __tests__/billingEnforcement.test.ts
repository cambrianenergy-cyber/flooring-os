import { initializeTestApp, loadFirestoreRules, clearFirestoreData } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { enforcePlanAndBilling } from '../../src/app/plans/enforcePlanAndBilling';
import { PLAN_FEATURES } from '../../src/app/plans/planFeatures';

describe('Billing & Plan Enforcement', () => {
  const projectId = 'test-project';
  let db: FirebaseFirestore.Firestore;

  beforeAll(async () => {
    await loadFirestoreRules({
      projectId,
      rules: readFileSync('firestore.rules', 'utf8'),
    });
  });

  beforeEach(async () => {
    db = initializeTestApp({ projectId, auth: { uid: 'admin' } }).firestore();
    await clearFirestoreData({ projectId });
  });

  afterAll(async () => {
    await clearFirestoreData({ projectId });
  });

  it('enforces user cap for plan', async () => {
    const workspaceId = 'ws1';
    await db.collection('workspaces').doc(workspaceId).set({
      planKey: 'square_start',
      billingStatus: 'active',
      members: Array(5).fill({}), // at cap
    });
    // Should allow
    let result = await enforcePlanAndBilling(workspaceId, 'users');
    expect(result.allowed).toBe(true);
    // Add one more user
    await db.collection('workspaces').doc(workspaceId).update({
      members: Array(6).fill({}),
    });
    result = await enforcePlanAndBilling(workspaceId, 'users');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/User cap/);
  });

  it('locks features on downgrade', async () => {
    const workspaceId = 'ws2';
    await db.collection('workspaces').doc(workspaceId).set({
      planKey: 'square_start',
      billingStatus: 'active',
      members: [],
    });
    let result = await enforcePlanAndBilling(workspaceId, 'ai');
    expect(result.allowed).toBe(false);
    // Simulate upgrade
    await db.collection('workspaces').doc(workspaceId).update({ planKey: 'square_pro' });
    result = await enforcePlanAndBilling(workspaceId, 'ai');
    expect(result.allowed).toBe(true);
    // Simulate downgrade
    await db.collection('workspaces').doc(workspaceId).update({ planKey: 'square_start' });
    result = await enforcePlanAndBilling(workspaceId, 'ai');
    expect(result.allowed).toBe(false);
  });

  it('locks workspace on failed payment', async () => {
    const workspaceId = 'ws3';
    await db.collection('workspaces').doc(workspaceId).set({
      planKey: 'square_pro',
      billingStatus: 'active',
      members: [],
    });
    let result = await enforcePlanAndBilling(workspaceId, 'ai');
    expect(result.allowed).toBe(true);
    // Simulate failed payment
    await db.collection('workspaces').doc(workspaceId).update({ billingStatus: 'past_due' });
    result = await enforcePlanAndBilling(workspaceId, 'ai');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Billing inactive/);
  });
});
