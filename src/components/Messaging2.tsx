
"use client";
import React, { useState } from "react";
import ModernMessageSettings from "./ModernMessageSettings";
import { deleteConversation } from "../lib/deleteConversation";
import { useConversations } from "../lib/useConversations";
import ChatUI from "./ChatUI";

type Tab = "inbox" | "outbox" | "all";

export default function Messaging2() {
  const { conversations, loading } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("inbox");
  const [showNew, setShowNew] = useState(false);
  const [drafts, setDrafts] = useState<{ [id: string]: string }>({});
  const [showSettings, setShowSettings] = useState(false);

  const userEmail = typeof window !== "undefined" ? localStorage.getItem("user_email") : undefined;

  // Always show AI agent as a special conversation
  const aiAgentId = "ai-agent";
  const aiAgentConversation = {
    id: aiAgentId,
    participants: ["AI Agent"],
    lastMessage: "Chat with SquareOS AI Agent",
    updatedAt: 0,
  };

  // Filter conversations for inbox/outbox
  const filtered = [aiAgentConversation, ...conversations].filter((c) => {
    if (c.id === aiAgentId) return true;
    if (tab === "inbox") return c.participants?.includes(userEmail || "");
    if (tab === "outbox") return c.participants?.some((p) => p !== userEmail);
    return true;
  });

  function handleNewConversation(agent = false) {
    const id = agent ? aiAgentId : `conv_${Date.now()}`;
    setActiveId(id);
    setShowNew(false);
  }

  async function handleDeleteConversation(id: string) {
    if (id === aiAgentId) return; // Don't delete AI agent
    try {
      await deleteConversation(id);
      // Optionally: show success or update local state
      alert("Conversation deleted.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Failed to delete conversation: " + msg);
    }
  }

  function handleDraftChange(id: string, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  }

  if (loading) return <div>Loading conversations…</div>;

  return (
    <div className="flex h-[70vh] max-w-4xl mx-auto border rounded shadow bg-white">
      <aside className="w-72 border-r p-4 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Conversations</h2>
          <button
            className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
            onClick={() => setShowNew(true)}
          >
            + New
          </button>
        </div>
        <div className="flex gap-2 mb-4">
          <button
            className={`px-2 py-1 rounded ${tab === "inbox" ? "bg-blue-100" : ""}`}
            onClick={() => setTab("inbox")}
          >Inbox</button>
          <button
            className={`px-2 py-1 rounded ${tab === "outbox" ? "bg-blue-100" : ""}`}
            onClick={() => setTab("outbox")}
          >Outbox</button>
          <button
            className={`px-2 py-1 rounded ${tab === "all" ? "bg-blue-100" : ""}`}
            onClick={() => setTab("all")}
          >All</button>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <li key={c.id} className="flex items-center group">
              <button
                className={`flex-1 block text-left px-2 py-2 rounded hover:bg-blue-50 ${activeId === c.id ? "bg-blue-100" : ""}`}
                onClick={() => setActiveId(c.id)}
              >
                {c.lastMessage ? c.lastMessage.slice(0, 40) : "(No messages)"}
                <div className="text-xs text-gray-500">{c.participants?.join(", ")}</div>
              </button>
              {c.id !== aiAgentId && (
                <button
                  className="ml-2 text-xs text-red-500 opacity-0 group-hover:opacity-100"
                  title="Delete conversation"
                  onClick={() => handleDeleteConversation(c.id)}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2">
          <button
            className="w-full bg-green-600 text-white py-2 rounded"
            onClick={() => handleNewConversation(true)}
          >
            Start AI Agent Chat
          </button>
          <button
            className="w-full bg-gray-200 text-gray-700 py-2 rounded"
            onClick={() => setShowSettings((v) => !v)}
          >
            Message Settings
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4">
        {showSettings ? (
          <ModernMessageSettings drafts={drafts} onClose={() => setShowSettings(false)} />
        ) : showNew ? (
          <div className="max-w-md mx-auto bg-gray-50 p-6 rounded shadow">
            <h3 className="font-semibold mb-2">New Conversation</h3>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
              onClick={() => handleNewConversation(false)}
            >
              Blank Chat
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => handleNewConversation(true)}
            >
              With AI Agent
            </button>
            <button
              className="ml-4 text-gray-500 underline"
              onClick={() => setShowNew(false)}
            >Cancel</button>
          </div>
        ) : activeId ? (
          <ChatUI conversationId={activeId} onDraftChange={(val) => handleDraftChange(activeId, val)} />
        ) : (
          <div className="text-gray-500">Select or start a conversation.</div>
        )}
      </main>
    </div>
  );
}
