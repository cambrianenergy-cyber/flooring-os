
'use client';


import React, { useState, useRef, useEffect } from "react";
import useChatMessages from "../lib/useChatMessages";


type ChatUIProps = {
  conversationId?: string;
  onDraftChange?: (draft: string) => void;
};

export default function ChatUI({ conversationId = "demo", onDraftChange }: ChatUIProps) {
  const { messages, loading, sendMessage } = useChatMessages(conversationId);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Example: pass context and tools for advanced AI
  const context = `Conversation ID: ${conversationId}`;
  const tools = ["search", "summarize", "quote_builder"];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError(null);
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
    if (onDraftChange) onDraftChange("");

    // Get AI settings from localStorage
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem("openai_api_key") : undefined;
    const aiModel = typeof window !== 'undefined' ? localStorage.getItem("msg_ai_model") || "gpt-4" : "gpt-4";
    const aiTemperature = typeof window !== 'undefined' ? Number(localStorage.getItem("msg_ai_temp") || 0.5) : 0.5;

    if (!apiKey) {
      setAiError("No OpenAI API key found. Please add your key in settings.");
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-agent/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, apiKey, context, tools, model: aiModel, temperature: aiTemperature }),
      });
      const data = await res.json();
      if (data.text) {
        await sendMessage(data.text, "agent");
      } else if (data.error) {
        setAiError(data.error);
      } else {
        setAiError("No response from AI.");
      }
    } catch (err: any) {
      setAiError("Failed to connect to OpenAI: " + (err?.message || err));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-lg mx-auto border rounded shadow bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-gray-400">Loading…</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "agent" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`px-3 py-2 rounded-lg max-w-xs text-sm shadow-sm ${
                  msg.sender === "agent"
                    ? "bg-gray-200 text-gray-800"
                    : "bg-blue-600 text-white"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      {aiError && (
        <div className="text-red-600 text-xs px-4 py-2">{aiError}</div>
      )}
      <form onSubmit={handleSend} className="flex p-2 border-t gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (onDraftChange) onDraftChange(e.target.value);
          }}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!input.trim() || aiLoading}
        >
          {aiLoading ? "AI thinking..." : "Send"}
        </button>
      </form>
    </div>
  );
}
