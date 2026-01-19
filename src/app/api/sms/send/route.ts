import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { to, body, conversationId } = await req.json();
  if (!to || !body) {
    return NextResponse.json({ ok: false, error: "Missing to or body" }, { status: 400 });
  }
  // Simulate sending SMS
  return NextResponse.json({ ok: true, message: "SMS sent (simulated)", to, body, conversationId });
}
