import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, apiKey } = body;
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }
  const keyToUse = apiKey || OPENAI_API_KEY;
  const useFallback = !keyToUse;

  const openaiMessages = [
    {
      role: "system",
      content:
        "You are a highly knowledgeable, helpful, and friendly expert in the flooring industry, specializing in sales, installation, and product knowledge. You are also skilled in everyday human conversation: be personable, empathetic, and engaging. Give clear, practical, and accurate advice for flooring reps, installers, and customers, but also respond naturally to greetings, small talk, and general questions. Always be concise, professional, and focused on real-world flooring scenarios, but never sound robotic."
    },
    ...messages.map((m: any) => ({
      role: m.sender === "agent" ? "assistant" : "user",
      content: m.text,
    })),
  ];

  if (useFallback) {
    // Preloaded fallback response
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
        model: "gpt-3.5-turbo",
        messages: openaiMessages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    let aiText = "[AI] Sorry, I couldn't generate a response.";
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      aiText = data.choices[0].message.content;
    } else if (data.error && data.error.message) {
      aiText = `[AI] Error: ${data.error.message}`;
    }
    return NextResponse.json({ text: aiText });
  } catch (err) {
    // Fallback if OpenAI fails
    return NextResponse.json({
      text: "[AI] This is a preloaded response. Please check your OpenAI API key or try again later."
    });
  }
}
