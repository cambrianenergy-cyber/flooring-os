import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as z from "zod";

const SaveStepSchema = z.object({
  currentStep: z.enum(["welcome", "company", "services", "goals", "team", "plan", "commit"]),
  updatedAt: z.number(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const idToken = authHeader.replace("Bearer ", "");
    const decoded = await getAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const body = await req.json();
    const parsed = SaveStepSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.issues }, { status: 400 });
    }

    const db = getFirestore();
    const intakeRef = db.collection("onboarding_intake").doc(uid);
    const onboardingStateRef = db.doc(`workspaces/${uid}/onboarding/state`);
    await Promise.all([
      intakeRef.set({
        ...parsed.data,
        uid,
      }, { merge: true }),
      onboardingStateRef.set({
        ...parsed.data,
        uid,
      }, { merge: true })
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
