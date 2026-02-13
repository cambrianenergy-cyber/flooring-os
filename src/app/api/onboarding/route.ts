import { NextResponse } from "next/server";
import admin from "firebase-admin";

function getAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID!;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKeyRaw) {
      throw new Error("FIREBASE_PRIVATE_KEY is not set");
    }
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  return admin;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    const a = getAdmin();
    const db = a.firestore();

    const ref = db.doc(`workspaces/${workspaceId}/onboarding/state`);
    const snap = await ref.get();

    return NextResponse.json({ data: snap.exists ? snap.data() : {} });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workspaceId = body?.workspaceId;
    const data = body?.data;

    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    if (!data || typeof data !== "object") return NextResponse.json({ error: "data object required" }, { status: 400 });

    const a = getAdmin();
    const db = a.firestore();

    const ref = db.doc(`workspaces/${workspaceId}/onboarding/state`);
    await ref.set(
      {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
