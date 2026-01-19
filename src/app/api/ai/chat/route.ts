

import { NextResponse } from "next/server";
import { requireAiBudget } from "@/lib/metering";

export const runtime = "nodejs"; // important if you use server env vars

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workspaceId = body?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }
    try {
      await requireAiBudget(workspaceId);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "AI_CREDITS_EXHAUSTED") {
        return NextResponse.json({ error: "Upgrade for more AI" }, { status: 402 });
      }
      return NextResponse.json({ error: err instanceof Error ? err.message : "AI metering error" }, { status: 403 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const messages = body?.messages;
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.4,
      }),
    });

    const text = await r.text();

    let data: {
      choices?: Array<{ message?: { content?: string } }>;
      [key: string]: unknown;
    };
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "OpenAI returned non-JSON", status: r.status, raw: text.slice(0, 200) },
        { status: 502 }
      );
    }

    if (!r.ok) {
      return NextResponse.json(
        { error: "OpenAI request failed", status: r.status, details: data },
        { status: 502 }
      );
    }

    const content = data?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ content });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Server error in /api/ai/chat", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
