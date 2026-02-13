import { adminDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const payload = await req.json();

  // TODO: validate DocuSign webhook signature if enabled
  const envelopeId = payload?.data?.envelopeId || payload?.envelopeId;
  const status = payload?.data?.status || payload?.status;

  if (!envelopeId)
    return NextResponse.json(
      { ok: false, error: "Missing envelopeId" },
      { status: 400 },
    );

  // You should store a mapping: envelopes/{envelopeId} -> { workspaceId, estimateId/jobId }
  await adminDb.collection("envelopes").doc(envelopeId).set(
    {
      envelopeId,
      status,
      updatedAt: new Date(),
      raw: payload,
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}
