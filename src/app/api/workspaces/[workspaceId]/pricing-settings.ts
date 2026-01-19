import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// GET: Fetch pricing settings for a workspace
export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
  const { workspaceId } = params;
  if (!workspaceId) return new NextResponse("Missing workspaceId", { status: 400 });
  const wsRef = adminDb().collection("workspaces").doc(workspaceId);
  const wsSnap = await wsRef.get();
  if (!wsSnap.exists) return new NextResponse("Workspace not found", { status: 404 });
  const data = wsSnap.data();
  const pricing = data ? data.pricingSettings || null : null;
  return NextResponse.json({ pricing });
}

// POST: Update pricing settings for a workspace
export async function POST(req: Request, { params }: { params: { workspaceId: string } }) {
  const { workspaceId } = params;
  if (!workspaceId) return new NextResponse("Missing workspaceId", { status: 400 });
  const wsRef = adminDb().collection("workspaces").doc(workspaceId);
  const wsSnap = await wsRef.get();
  if (!wsSnap.exists) return new NextResponse("Workspace not found", { status: 404 });
  const data = await req.json();
  await wsRef.set({ pricingSettings: data, updatedAt: new Date() }, { merge: true });
  return NextResponse.json({ ok: true });
}
