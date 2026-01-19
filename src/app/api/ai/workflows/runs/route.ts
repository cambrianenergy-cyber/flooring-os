import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ ok: false, error: "workspaceId required" }, { status: 400 });
    }

    const db = adminDb();
    const snap = await db
      .collection("workflow_runs")
      .where("workspaceId", "==", workspaceId)
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();

    const runs = snap.docs.map((d: FirebaseFirestore.DocumentSnapshot) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, runs });
  } catch (e) {
    console.error("Failed to list runs:", e);
    const msg = typeof e === "object" && e && "message" in e ? (e as Error).message : "Failed to list runs";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const workspaceId = body.workspaceId as string;

    if (!workspaceId) {
      return NextResponse.json({ ok: false, error: "workspaceId required" }, { status: 400 });
    }

    const db = adminDb();
    const snap = await db
      .collection("workflow_runs")
      .where("workspaceId", "==", workspaceId)
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();

    const runs = snap.docs.map((d: FirebaseFirestore.DocumentSnapshot) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, runs });
  } catch (e) {
    console.error("Failed to list runs:", e);
    const msg = typeof e === "object" && e && "message" in e ? (e as Error).message : "Failed to list runs";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
