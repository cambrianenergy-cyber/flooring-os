
import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json({ ok: false, error: "Missing run id", received: id }, { status: 400 });
    }

    // IMPORTANT: confirm this collection name matches your database
    const ref = doc(db, "workflow_runs", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ ok: false, error: "Execution not found", id }, { status: 404 });
    }

    return NextResponse.json({ ok: true, run: { id: snap.id, ...snap.data() } }, { status: 200 });
  } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ok: false, error: "Server error", message: errorMessage }, { status: 500 });
  }
}
