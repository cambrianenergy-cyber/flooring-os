import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * GET /api/workflows?workspaceId=...
 * Fetch up to 100 enabled workflows for a workspace, ordered by updatedAt descending
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId } = params;
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }
    const workflowsQuery = query(
      collection(db, 'workflows'),
      where('workspaceId', '==', workspaceId),
      where('enabled', '==', true),
      orderBy('updatedAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(workflowsQuery);
    const workflows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('GET /api/workflows error:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}
