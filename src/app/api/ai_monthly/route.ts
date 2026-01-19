import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * GET /api/ai_monthly?workspaceId=...
 * Fetch up to 24 ai_monthly records for a workspace, ordered by yyyymm descending
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId } = params;
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }
    const monthlyQuery = query(
      collection(db, 'ai_monthly'),
      where('workspaceId', '==', workspaceId),
      orderBy('yyyymm', 'desc'),
      limit(24)
    );
    const snap = await getDocs(monthlyQuery);
    const aiMonthly = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ aiMonthly });
  } catch (error) {
    console.error('GET /api/ai_monthly error:', error);
    return NextResponse.json({ error: 'Failed to fetch ai monthly' }, { status: 500 });
  }
}
