import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  // DocuSign posts XML/JSON depending on Connect settings
  const payload = await req.text();

  // TODO: parse payload -> envelopeId + status + estimateId (recommended: customFields)
  const envelopeId = "TODO";
  const status = "completed"; // example
  const estimateId = "TODO";
  const workspaceId = "TODO";

  const db = adminDb();

  // update estimate contract status
  await db.collection("estimates").doc(estimateId).set({
    status: status === "completed" ? "signed" : undefined,
    contract: {
      provider: "docusign",
      envelopeId,
      status,
      signedDocumentUrl: null,
    },
    signedAt: status === "completed" ? new Date() : null,
    updatedAt: new Date(),
  }, { merge: true });

  return NextResponse.json({ ok: true });
}
