import { adminDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const { workspaceId, estimateId, customerEmail, customerName } =
    await req.json();

  if (!workspaceId || !estimateId) {
    return NextResponse.json(
      { ok: false, error: "Missing workspaceId/estimateId" },
      { status: 400 },
    );
  }

  // TODO: fetch DocuSign workspace integration settings
  const integSnap = await adminDb
    .collection("integrations")
    .doc(`${workspaceId}_docusign`)
    .get();
  const integ = integSnap.data();

  if (!integ?.isConnected) {
    return NextResponse.json(
      { ok: false, error: "DocuSign not connected for this workspace" },
      { status: 400 },
    );
  }

  // TODO: call DocuSign API here (create envelope from template)
  // For now, we create a stub envelope record.
  const envelopeId = `stub_${Date.now()}`;

  await adminDb.collection("envelopes").doc(envelopeId).set({
    envelopeId,
    workspaceId,
    estimateId,
    status: "sent",
    customerEmail,
    customerName,
    createdAt: new Date(),
  });

  await adminDb
    .collection("estimates")
    .doc(estimateId)
    .set(
      { docusign: { envelopeId, status: "sent" }, updatedAt: new Date() },
      { merge: true },
    );

  return NextResponse.json({ ok: true, envelopeId });
}
