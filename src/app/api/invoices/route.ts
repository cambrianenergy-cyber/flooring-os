import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * GET /api/invoices?workspaceId=...&status=...
 * Fetch up to 100 invoices for a workspace with a specific status, ordered by updatedAt descending
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, status } = params;
    if (!workspaceId || !status) {
      return NextResponse.json({ error: 'Missing workspaceId or status' }, { status: 400 });
    }
    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('workspaceId', '==', workspaceId),
      where('status', '==', status),
      orderBy('updatedAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(invoicesQuery);
    const invoices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

/**
 * GET /api/invoices/by-job?workspaceId=...&jobId=...
 * Fetch up to 20 invoices for a workspace by jobId
 */
export async function GET_BY_JOB(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, jobId } = params;
    if (!workspaceId || !jobId) {
      return NextResponse.json({ error: 'Missing workspaceId or jobId' }, { status: 400 });
    }
    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('workspaceId', '==', workspaceId),
      where('jobId', '==', jobId),
      limit(20)
    );
    const snap = await getDocs(invoicesQuery);
    const invoices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('GET_BY_JOB /api/invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
