import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, uid, status } = params;
    if (!workspaceId || !uid || !status) {
      return NextResponse.json({ error: 'Missing workspaceId, uid, or status' }, { status: 400 });
    }
    const leadsQuery = query(
      collection(db, 'leads'),
      where('workspaceId', '==', workspaceId),
      where('assignedToUid', '==', uid),
      where('status', '==', status),
      orderBy('updatedAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(leadsQuery);
    const leads = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ leads });
  } catch (error) {
    console.error('GET /api/leads error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function GET_NEXT_ACTION(request: Request) {
  try {
    const url = new URL(request.url);
    const { workspaceId } = Object.fromEntries(url.searchParams);
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }
    const leadsQuery = query(
      collection(db, 'leads'),
      where('workspaceId', '==', workspaceId),
      where('nextActionAt', '<=', new Date()),
      orderBy('nextActionAt', 'asc'),
      limit(100)
    );
    const snap = await getDocs(leadsQuery);
    const leads = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ leads });
  } catch (error) {
    console.error('GET_NEXT_ACTION /api/leads error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
