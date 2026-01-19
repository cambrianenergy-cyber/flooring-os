import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, apiKey, tools, context, model, temperature } = body;
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }
  const keyToUse = apiKey || OPENAI_API_KEY;
  const useFallback = !keyToUse;

  // System prompt with context and tool awareness
  let systemPrompt =
    "You are a highly knowledgeable, helpful, and friendly expert in the flooring industry, specializing in sales, installation, and product knowledge. You are also skilled in everyday human conversation: be personable, empathetic, and engaging. Give clear, practical, and accurate advice for flooring reps, installers, and customers, but also respond naturally to greetings, small talk, and general questions. Always be concise, professional, and focused on real-world flooring scenarios, but never sound robotic.";
  if (context) {
    systemPrompt += `\nContext: ${context}`;
  }
  if (tools && Array.isArray(tools) && tools.length > 0) {
    systemPrompt += `\nYou have access to these tools: ${tools.join(", ")}`;
  }

  const openaiMessages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...messages.map((m: any) => ({
      role: m.sender === "agent" ? "assistant" : "user",
      content: m.text,
    })),
  ];

  if (useFallback) {
    return NextResponse.json({
      text: "[AI] This is a preloaded response. Please add your own OpenAI API key in your account settings to enable live AI answers."
    });
  }
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${keyToUse}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4",
        messages: openaiMessages,
        max_tokens: 600,
        temperature: typeof temperature === 'number' ? temperature : 0.5,
        tools: tools || undefined,
      }),
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      return NextResponse.json({
        error: `OpenAI returned non-JSON response (status ${response.status}): ${text.slice(0, 200)}`
      }, { status: 502 });
    }
    const data = await response.json();
    let aiText = "[AI] Sorry, I couldn't generate a response.";
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      aiText = data.choices[0].message.content;
    } else if (data.error && data.error.message) {
      aiText = `[AI] Error: ${data.error.message}`;
    }
    return NextResponse.json({ text: aiText });
  } catch (err: any) {
    return NextResponse.json({
      error: "[AI] Failed to connect to OpenAI: " + (err?.message || err)
    }, { status: 500 });
  }
}
