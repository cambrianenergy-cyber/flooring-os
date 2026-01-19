import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * GET /api/notifications?workspaceId=...&uid=...
 * Fetch up to 100 notifications for a workspace and user, unread first, ordered by createdAt descending
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, uid } = params;
    if (!workspaceId || !uid) {
      return NextResponse.json({ error: 'Missing workspaceId or uid' }, { status: 400 });
    }
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('workspaceId', '==', workspaceId),
      where('toUid', '==', uid),
      orderBy('readAt', 'asc'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(notificationsQuery);
    const notifications = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
