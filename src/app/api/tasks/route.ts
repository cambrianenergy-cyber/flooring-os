import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * GET /api/tasks?workspaceId=...&status=...
 * Fetch up to 100 tasks for a workspace with a specific status, ordered by dueAt ascending
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, status } = params;
    if (!workspaceId || !status) {
      return NextResponse.json({ error: 'Missing workspaceId or status' }, { status: 400 });
    }
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('workspaceId', '==', workspaceId),
      where('status', '==', status),
      orderBy('dueAt', 'asc'),
      limit(100)
    );
    const snap = await getDocs(tasksQuery);
    const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

/**
 * GET /api/tasks/assigned?workspaceId=...&uid=...&status=...
 * Fetch up to 100 tasks for a workspace assigned to a user with a specific status, ordered by dueAt ascending
 */
export async function GET_ASSIGNED(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, uid, status } = params;
    if (!workspaceId || !uid || !status) {
      return NextResponse.json({ error: 'Missing workspaceId, uid, or status' }, { status: 400 });
    }
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('workspaceId', '==', workspaceId),
      where('assignedToUid', '==', uid),
      where('status', '==', status),
      orderBy('dueAt', 'asc'),
      limit(100)
    );
    const snap = await getDocs(tasksQuery);
    const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('GET_ASSIGNED /api/tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

/**
 * GET /api/tasks/by-entity?workspaceId=...&entityType=...&entityId=...
 * Fetch up to 100 tasks for a workspace by entityType and entityId, ordered by createdAt descending
 */
export async function GET_BY_ENTITY(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, entityType, entityId } = params;
    if (!workspaceId || !entityType || !entityId) {
      return NextResponse.json({ error: 'Missing workspaceId, entityType, or entityId' }, { status: 400 });
    }
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('workspaceId', '==', workspaceId),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(tasksQuery);
    const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('GET_BY_ENTITY /api/tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
