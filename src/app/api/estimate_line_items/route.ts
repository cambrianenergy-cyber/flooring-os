import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

/**
 * GET /api/estimate_line_items?workspaceId=...&estimateId=...
 * Fetch all estimate_line_items for a workspace and estimate, ordered by createdAt ascending
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, estimateId } = params;
    if (!workspaceId || !estimateId) {
      return NextResponse.json({ error: 'Missing workspaceId or estimateId' }, { status: 400 });
    }
    const itemsQuery = query(
      collection(db, 'estimate_line_items'),
      where('workspaceId', '==', workspaceId),
      where('estimateId', '==', estimateId),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(itemsQuery);
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/estimate_line_items error:', error);
    return NextResponse.json({ error: 'Failed to fetch estimate line items' }, { status: 500 });
  }
}
