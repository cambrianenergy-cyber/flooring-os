import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// POST: Save or update company profile
export async function POST(req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    const body = await req.json();
    const { workspaceId } = params;
    if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    // Save profile data to Firestore
    const ref = adminDb().collection("workspaces").doc(workspaceId);
    await ref.set({ companyProfile: { ...body, updatedAt: new Date() } }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const error = err instanceof Error ? err : { message: String(err) };
    return NextResponse.json({ error: error.message || "Save failed" }, { status: 500 });
  }
}

// GET: Fetch company profile
export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    const { workspaceId } = params;
    if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    const ref = adminDb().collection("workspaces").doc(workspaceId);
    const snap = await ref.get();
    const data = snap.exists ? snap.data()?.companyProfile || null : null;
    return NextResponse.json({ profile: data });
  } catch (err) {
    const error = err instanceof Error ? err : { message: String(err) };
    return NextResponse.json({ error: error.message || "Fetch failed" }, { status: 500 });
  }
}
