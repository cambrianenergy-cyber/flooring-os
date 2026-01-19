import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

function createSseHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
  };
}

export async function GET(req: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  const trimmedRunId = runId?.trim();

  if (!trimmedRunId || trimmedRunId === "undefined" || trimmedRunId === "null") {
    return NextResponse.json({ ok: false, error: "Missing run id", received: runId }, { status: 400 });
  }

  const url = new URL(req.url);
  const wantsStream = url.searchParams.get("stream") === "1" || req.headers.get("accept")?.includes("text/event-stream");

  // Non-streaming fallback (one-shot fetch)
  if (!wantsStream) {
    try {
      const db = adminDb();
      const runRef = db.collection("workflow_runs").doc(trimmedRunId);
      const snap = await runRef.get();

      if (!snap.exists) {
        return NextResponse.json({ ok: false, error: "Execution not found", id: trimmedRunId }, { status: 404 });
      }

      return NextResponse.json({ ok: true, run: { id: snap.id, ...snap.data() } }, { status: 200 });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Failed to get run:", e);
      return NextResponse.json({ ok: false, error: "Server error", message: errorMessage }, { status: 500 });
    }
  }

  // Live stream via SSE
  const db = adminDb();
  const runRef = db.collection("workflow_runs").doc(trimmedRunId);
  const snap = await runRef.get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "Execution not found", id: trimmedRunId }, { status: 404 });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = (event: string, data: unknown) => {
    writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  };

  // Initial payload
  sendEvent("run", { run: { id: snap.id, ...snap.data() } });

  // Poll for updates every 5 seconds (example interval)
  const pollInterval = setInterval(async () => {
    const latestSnap = await runRef.get();
    if (!latestSnap.exists) {
      sendEvent("error", { message: "Run document deleted" });
      writer.close();
      clearInterval(pollInterval);
      return;
    }
    sendEvent("run", { run: { id: latestSnap.id, ...latestSnap.data() } });
  }, 5000);

  const heartbeat = setInterval(() => {
    writer.write(encoder.encode("event: ping\ndata: {}\n\n"));
  }, 20000);

  const close = () => {
    clearInterval(heartbeat);
    clearInterval(pollInterval);
    writer.close();
  };

  // Close stream if the client disconnects
  req.signal.addEventListener("abort", close);

  return new Response(readable, {
    status: 200,
    headers: createSseHeaders(),
  });
}
