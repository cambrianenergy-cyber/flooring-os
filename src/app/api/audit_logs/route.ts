import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * GET /api/audit_logs?workspaceId=...
 * Fetch up to 200 audit_logs for a workspace, ordered by createdAt descending
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId } = params;
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }
    const logsQuery = query(
      collection(db, 'audit_logs'),
      where('workspaceId', '==', workspaceId),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snap = await getDocs(logsQuery);
    const auditLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error('GET /api/audit_logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

/**
 * GET /api/audit_logs/by-action?workspaceId=...&action=...
 * Fetch up to 200 audit_logs for a workspace and action, ordered by createdAt descending
 */
export async function GET_BY_ACTION(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, action } = params;
    if (!workspaceId || !action) {
      return NextResponse.json({ error: 'Missing workspaceId or action' }, { status: 400 });
    }
    const logsQuery = query(
      collection(db, 'audit_logs'),
      where('workspaceId', '==', workspaceId),
      where('action', '==', action),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snap = await getDocs(logsQuery);
    const auditLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error('GET_BY_ACTION /api/audit_logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
