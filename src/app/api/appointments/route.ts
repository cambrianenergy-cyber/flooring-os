import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * GET /api/appointments?workspaceId=...&startAfter=...
 * Fetch up to 200 appointments for a workspace starting after a given date, ordered by startAt ascending
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, startAfter } = params;
    if (!workspaceId || !startAfter) {
      return NextResponse.json({ error: 'Missing workspaceId or startAfter' }, { status: 400 });
    }
    const startDate = new Date(startAfter);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid startAfter date' }, { status: 400 });
    }
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('workspaceId', '==', workspaceId),
      where('startAt', '>=', startDate),
      orderBy('startAt', 'asc'),
      limit(200)
    );
    const snap = await getDocs(appointmentsQuery);
    const appointments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('GET /api/appointments error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

/**
 * GET /api/appointments/by-entity?workspaceId=...&entityType=...&entityId=...
 * Fetch up to 100 appointments for a workspace by entityType and entityId, ordered by startAt descending
 */
export async function GET_BY_ENTITY(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, entityType, entityId } = params;
    if (!workspaceId || !entityType || !entityId) {
      return NextResponse.json({ error: 'Missing workspaceId, entityType, or entityId' }, { status: 400 });
    }
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('workspaceId', '==', workspaceId),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('startAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(appointmentsQuery);
    const appointments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('GET_BY_ENTITY /api/appointments error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}
