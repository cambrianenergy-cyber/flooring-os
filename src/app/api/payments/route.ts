// Minimal valid GET handler to satisfy Next.js
export function GET() {
  return new Response('OK');
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * GET /api/payments/by-invoice?workspaceId=...&invoiceId=...
 * Fetch up to 50 payments for a workspace by invoiceId, ordered by createdAt descending
 */
export async function GET_BY_INVOICE(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, invoiceId } = params;
    if (!workspaceId || !invoiceId) {
      return NextResponse.json({ error: 'Missing workspaceId or invoiceId' }, { status: 400 });
    }
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('workspaceId', '==', workspaceId),
      where('invoiceId', '==', invoiceId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(paymentsQuery);
    const payments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('GET_BY_INVOICE /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
