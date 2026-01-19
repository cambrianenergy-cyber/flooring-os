import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { resolvePlan } from '@/lib/plans';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';

// Helper to check estimate intelligence feature
async function requireEstimateIntelligence(workspaceId: string) {
  const wsSnap = await getDoc(doc(db, 'workspaces', workspaceId));
  if (!wsSnap.exists()) throw new Error('WORKSPACE_NOT_FOUND');
  const plan = resolvePlan(wsSnap.data()?.plan?.key);
  if (!plan.features.estimateIntelligence) {
    throw new Error('ESTIMATE_INTELLIGENCE_NOT_AVAILABLE');
  }
}

export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { workspaceId, status, advanced } = params;
    if (!workspaceId || !status) {
      return NextResponse.json({ error: 'Missing workspaceId or status' }, { status: 400 });
    }
    // If advanced estimate intelligence is requested, enforce plan feature
    if (advanced === 'true') {
      try {
        await requireEstimateIntelligence(workspaceId);
      } catch {
        return NextResponse.json({ error: 'Advanced estimate intelligence not available for your plan.' }, { status: 403 });
      }
    }
    const estimatesQuery = query(
      collection(db, 'estimates'),
      where('workspaceId', '==', workspaceId),
      where('status', '==', status),
      orderBy('updatedAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(estimatesQuery);
    const estimates = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ estimates });
  } catch (error) {
    console.error('GET /api/estimates error:', error);
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}

export async function GET_BY_LEAD(request: Request) {
  // Add similar enforcement if advanced estimate intelligence is supported here
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { workspaceId, leadId } = params;
    if (!workspaceId || !leadId) {
      return NextResponse.json({ error: 'Missing workspaceId or leadId' }, { status: 400 });
    }
    const estimatesQuery = query(
      collection(db, 'estimates'),
      where('workspaceId', '==', workspaceId),
      where('leadId', '==', leadId),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(estimatesQuery);
    const estimates = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ estimates });
  } catch (error) {
    console.error('GET_BY_LEAD /api/estimates error:', error);
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}

/**
 * GET /api/estimates/by-contact?workspaceId=...&contactId=...
 * Fetch up to 50 estimates for a workspace by contactId, ordered by updatedAt desc
 */
export async function GET_BY_CONTACT(request: Request) {
  // Add similar enforcement if advanced estimate intelligence is supported here
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { workspaceId, contactId } = params;
    if (!workspaceId || !contactId) {
      return NextResponse.json({ error: 'Missing workspaceId or contactId' }, { status: 400 });
    }
    const estimatesQuery = query(
      collection(db, 'estimates'),
      where('workspaceId', '==', workspaceId),
      where('contactId', '==', contactId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(estimatesQuery);
    const estimates = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ estimates });
  } catch (error) {
    console.error('GET_BY_CONTACT /api/estimates error:', error);
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}

/**
 * GET /api/estimates/by-job?workspaceId=...&jobId=...
 * Fetch up to 10 estimates for a workspace by jobId
 */
export async function GET_BY_JOB(request: Request) {
  // Add similar enforcement if advanced estimate intelligence is supported here
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { workspaceId, jobId } = params;
    if (!workspaceId || !jobId) {
      return NextResponse.json({ error: 'Missing workspaceId or jobId' }, { status: 400 });
    }
    const estimatesQuery = query(
      collection(db, 'estimates'),
      where('workspaceId', '==', workspaceId),
      where('jobId', '==', jobId),
      limit(10)
    );
    const snap = await getDocs(estimatesQuery);
    const estimates = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ estimates });
  } catch (error) {
    console.error('GET_BY_JOB /api/estimates error:', error);
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}

/**
 * GET /api/estimates/expiring?workspaceId=...&expiresBefore=...
 * Fetch up to 100 estimates for a workspace expiring before a given date, ordered by expiresAt ascending
 */
export async function GET_EXPIRING(request: Request) {
  // Add similar enforcement if advanced estimate intelligence is supported here
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { workspaceId, expiresBefore } = params;
    if (!workspaceId || !expiresBefore) {
      return NextResponse.json({ error: 'Missing workspaceId or expiresBefore' }, { status: 400 });
    }
    const expiresDate = new Date(expiresBefore);
    if (isNaN(expiresDate.getTime())) {
      return NextResponse.json({ error: 'Invalid expiresBefore date' }, { status: 400 });
    }
    const estimatesQuery = query(
      collection(db, 'estimates'),
      where('workspaceId', '==', workspaceId),
      where('expiresAt', '<=', expiresDate),
      orderBy('expiresAt', 'asc'),
      limit(100)
    );
    const snap = await getDocs(estimatesQuery);
    const estimates = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ estimates });
  } catch (error) {
    console.error('GET_EXPIRING /api/estimates error:', error);
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}
