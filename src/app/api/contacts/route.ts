import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { workspaceId } = Object.fromEntries(url.searchParams);
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }
    const contactsQuery = query(
      collection(db, 'contacts'),
      where('workspaceId', '==', workspaceId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(contactsQuery);
    const contacts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('GET /api/contacts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function GET_CREATED(request: Request) {
  try {
    const url = new URL(request.url);
    const { workspaceId } = Object.fromEntries(url.searchParams);
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }
    const contactsQuery = query(
      collection(db, 'contacts'),
      where('workspaceId', '==', workspaceId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(contactsQuery);
    const contacts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('GET_CREATED /api/contacts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}
