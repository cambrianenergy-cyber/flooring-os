import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * GET /api/workflow_runs?workspaceId=...&status=...
 * Fetch up to 200 workflow_runs for a workspace with a specific status, ordered by createdAt descending
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, status } = params;
    if (!workspaceId || !status) {
      return NextResponse.json({ error: 'Missing workspaceId or status' }, { status: 400 });
    }
    const runsQuery = query(
      collection(db, 'workflow_runs'),
      where('workspaceId', '==', workspaceId),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snap = await getDocs(runsQuery);
    const workflowRuns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ workflowRuns });
  } catch (error) {
    console.error('GET /api/workflow_runs error:', error);
    return NextResponse.json({ error: 'Failed to fetch workflow runs' }, { status: 500 });
  }
}
