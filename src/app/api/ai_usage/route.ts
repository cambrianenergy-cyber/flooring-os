import { NextResponse } from 'next/server';

import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * GET /api/ai_usage?workspaceId=...
 * Fetch up to 200 ai_usage records for a workspace, ordered by createdAt descending
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: any) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const { workspaceId } = params;
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }
    const usageQuery = query(
      collection(db, 'ai_usage'),
      where('workspaceId', '==', workspaceId),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snap = await getDocs(usageQuery);
    const aiUsage = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ aiUsage });
  } catch (error) {
    console.error('GET /api/ai_usage error:', error);
    return NextResponse.json({ error: 'Failed to fetch ai usage' }, { status: 500 });
  }
}

/**
 * GET /api/ai_usage/by-kind?workspaceId=...&kind=...
 * Fetch up to 200 ai_usage records for a workspace and kind, ordered by createdAt descending
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET_BY_KIND(request: any) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const { workspaceId, kind } = params;
    if (!workspaceId || !kind) {
      return NextResponse.json({ error: 'Missing workspaceId or kind' }, { status: 400 });
    }
    const usageQuery = query(
      collection(db, 'ai_usage'),
      where('workspaceId', '==', workspaceId),
      where('kind', '==', kind),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snap = await getDocs(usageQuery);
    const aiUsage = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ aiUsage });
  } catch (error) {
    console.error('GET_BY_KIND /api/ai_usage error:', error);
    return NextResponse.json({ error: 'Failed to fetch ai usage' }, { status: 500 });
  }
}
