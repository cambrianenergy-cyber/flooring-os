// Backend Geometry API Routes
// Place in: src/app/api/geometry/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { logAuditEvent } from '@/lib/observability';

export const runtime = 'nodejs';

/**
 * Geometry JSON Schema per Room
 */
export interface GeometryData {
  roomId: string;
  jobId: string;
  mode: 'points' | 'sketch' | 'laser-legacy';
  version: number;
  points: Array<{
    id: string;
    x: number; // pixels or cm
    y: number;
    label?: string;
  }>;
  segments: Array<{
    id: string;
    p1: string; // point ID
    p2: string;
    length?: number; // feet or cm
    type: 'wall' | 'corner' | 'opening' | 'reference';
  }>;
  labels: Array<{
    id: string;
    segmentId?: string;
    text: string;
    x: number;
    y: number;
  }>;
  updatedAt: string; // ISO timestamp
  updatedBy: string; // user ID
  checksum?: string; // for integrity
}

/**
 * POST /api/geometry/rooms/:roomId
 * Store or update room geometry
 */
export async function POST(request: Request) {
  try {

    // Parse URL and body
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const roomId = pathSegments.at(-1);
    const geometry: GeometryData = await request.json();

    if (!roomId || !geometry.roomId || geometry.roomId !== roomId) {
      return NextResponse.json({ error: 'Invalid roomId' }, { status: 400 });
    }

    // Validate auth
    const sessionUser = request.headers.get('authorization');
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate geometry schema
    if (!geometry.points || !Array.isArray(geometry.segments)) {
      return NextResponse.json({ error: 'Invalid geometry format' }, { status: 400 });
    }

    // Store in Firestore
    const geometryRef = doc(db, 'jobs', geometry.jobId, 'rooms', roomId, 'geometry', 'current');
    await setDoc(geometryRef, {
      ...geometry,
      updatedAt: new Date().toISOString(),
      updatedBy: sessionUser,
    }, { merge: true });

    // Log to audit trail
    const auditRef = collection(db, 'jobs', geometry.jobId, 'auditLogs');
    await setDoc(doc(auditRef), {
      action: 'geometry.update',
      roomId,
      actor: sessionUser,
      timestamp: new Date().toISOString(),
      version: geometry.version,
    });

    // Audit log (workspace-resolved)
    const jobSnap = await getDoc(doc(db, 'jobs', geometry.jobId));
    const jobData = jobSnap.exists() ? jobSnap.data() : null;
    const workspaceId = jobData && typeof jobData === 'object' && 'workspaceId' in jobData ? (jobData as { workspaceId?: string }).workspaceId : null;
    if (workspaceId) {
      await logAuditEvent({
        workspaceId,
        actorType: 'user',
        actorId: sessionUser ?? undefined,
        action: 'geometry.update',
        entityType: 'room',
        entityId: roomId || '',
        meta: { jobId: geometry.jobId, version: geometry.version },
      });
    }

    return NextResponse.json({ success: true, roomId, version: geometry.version });
  } catch (error) {
    console.error('POST /api/geometry error:', error);
    return NextResponse.json({ error: 'Failed to store geometry' }, { status: 500 });
  }
}

/**
 * GET /api/geometry/rooms/:roomId
 * Retrieve room geometry
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId');
    const jobId = url.searchParams.get('jobId');
    if (!roomId || !jobId) {
      return NextResponse.json({ error: 'Missing roomId or jobId' }, { status: 400 });
    }

    const geometryRef = doc(db, 'jobs', jobId, 'rooms', roomId, 'geometry', 'current');
    const snap = await getDoc(geometryRef);

    if (!snap.exists()) {
      return NextResponse.json({ geometry: null }, { status: 200 });
    }

    return NextResponse.json({ geometry: snap.data() });
  } catch (error) {
    console.error('GET /api/geometry error:', error);
    return NextResponse.json({ error: 'Failed to retrieve geometry' }, { status: 500 });
  }
}

/**
 * DELETE /api/geometry/rooms/:roomId
 * Archive or soft-delete geometry (set archived flag)
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId');
    const jobId = url.searchParams.get('jobId');
    if (!roomId || !jobId) {
      return NextResponse.json({ error: 'Missing roomId or jobId' }, { status: 400 });
    }

    const geometryRef = doc(db, 'jobs', jobId, 'rooms', roomId, 'geometry', 'current');
    await setDoc(geometryRef, { archived: true, archivedAt: new Date().toISOString() }, { merge: true });

    const jobSnap = await getDoc(doc(db, 'jobs', jobId));
    const jobData = jobSnap.exists() ? jobSnap.data() : null;
    const workspaceId = jobData && typeof jobData === 'object' && 'workspaceId' in jobData ? (jobData as { workspaceId?: string }).workspaceId : null;
    if (workspaceId) {
      await logAuditEvent({
        workspaceId,
        actorType: 'user',
        actorId: request.headers.get('authorization') ?? undefined,
        action: 'geometry.archive',
        entityType: 'room',
        entityId: roomId || '',
        meta: { jobId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/geometry error:', error);
    return NextResponse.json({ error: 'Failed to delete geometry' }, { status: 500 });
  }
}

/**
 * GET /api/geometry/contacts?workspaceId=...
 * Fetch up to 50 contacts for a workspace, ordered by updatedAt desc
 */
