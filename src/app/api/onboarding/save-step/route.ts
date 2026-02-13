import { NextResponse } from "next/server";
import admin from "firebase-admin";

function getAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        `Missing Firebase Admin env vars. Have projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  return admin;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("BODY:", body);
    console.log("ENV:", {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY
    });

    const workspaceId = body?.workspaceId;
    const step = body?.step;
    const data = body?.data;

    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    if (!step) return NextResponse.json({ error: "step required" }, { status: 400 });
    if (!data || typeof data !== "object")
      return NextResponse.json({ error: "data object required" }, { status: 400 });

    const a = getAdmin();
    const db = a.firestore();

    // ✅ valid doc path (even segments)
    const ref = db.doc(`workspaces/${workspaceId}/onboarding/state`);

    await ref.set(
      {
        [`step${String(step)}`]: data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("save-step error:", err?.message || err, err?.stack || "");
    return NextResponse.json(
      { error: "Internal Server Error", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
