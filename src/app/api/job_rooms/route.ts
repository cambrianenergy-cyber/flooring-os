import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { workspaceId, jobId } = params;
    if (!workspaceId || !jobId) {
      return NextResponse.json({ error: 'Missing workspaceId or jobId' }, { status: 400 });
    }
    const jobRoomsQuery = query(
      collection(db, 'job_rooms'),
      where('workspaceId', '==', workspaceId),
      where('jobId', '==', jobId),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(jobRoomsQuery);
    const jobRooms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ jobRooms });
  } catch (error) {
    console.error('GET /api/job_rooms error:', error);
    return NextResponse.json({ error: 'Failed to fetch job rooms' }, { status: 500 });
  }
}
