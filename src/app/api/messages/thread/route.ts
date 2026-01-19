import { NextResponse } from "next/server";

const threads: Record<string, any> = {
  "1": {
    conversation: { id: "1", customerPhone: "+12145550111" },
    messages: [
      { id: "m1", direction: "IN", body: "Hi, I need a quote." },
      { id: "m2", direction: "OUT", body: "Sure! What type of flooring?" },
    ],
  },
  "2": {
    conversation: { id: "2", customerPhone: "+12145550222" },
    messages: [
      { id: "m3", direction: "IN", body: "Do you install tile?" },
      { id: "m4", direction: "OUT", body: "Yes, we do!" },
    ],
  },
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId || !threads[conversationId]) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...threads[conversationId] });
}
