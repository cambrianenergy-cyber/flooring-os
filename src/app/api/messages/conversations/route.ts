import { NextRequest, NextResponse } from "next/server";

// Dummy in-memory data for demo
const conversations = [
  { id: "1", customerPhone: "+12145550111" },
  { id: "2", customerPhone: "+12145550222" },
];

export async function GET() {
  return NextResponse.json({ ok: true, conversations });
}
