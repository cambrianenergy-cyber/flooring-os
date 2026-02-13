import * as admin from "firebase-admin";
import { NextResponse } from "next/server";

// Initialize only if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// This endpoint triggers a snapshot rebuild for all workspaces (manual run)
export async function POST(req: Request) {
  // Optionally, add authentication/authorization here
  // For now, just trigger a Firestore write to a control collection
  try {
    await db.collection("adminControls").add({
      type: "rebuildSnapshots",
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return NextResponse.json({
      ok: true,
      message: "Snapshot rebuild requested.",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
