import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";

import { authOptions } from "../auth/[...nextauth]";
import { AGENTS, type AgentKey } from "@/lib/agents/registry";

// Scaffold mailbox agent
function mailboxAgent(input: any) {
  // TODO: Implement unified mailbox logic
  return {
    text: "Unified mailbox agent is not yet implemented.",
    actions: [{ label: "View Messages" }, { label: "Route Task" }],
    messages: [],
  };
}

import OpenAI from "openai";
// OpenAI setup (add your API key to environment variables)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function openaiCompletion(prompt: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 256,
  });
  return response.choices[0]?.message?.content ?? "";
}

function isAgentKey(x: unknown): x is AgentKey {
  return typeof x === "string" && x in AGENTS;
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Runtime check for OpenAI API key
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith('sk-')) {
      console.error('OpenAI API key is missing or invalid:', process.env.OPENAI_API_KEY);
      return res.status(500).json({ error: 'OpenAI API key is missing or invalid on the server.' });
    }
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const session = (await getServerSession(req, res, authOptions)) as Session | null;

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Accept multiple possible client keys; prefer agentType
    const agentType =
      (req.body?.agentType ??
        req.body?.agentKey ??
        req.body?.agent ??
        req.body?.agentId) ?? null;

    if (!isAgentKey(agentType)) {
      return res.status(400).json({
        error: "Unknown agent.",
        received: agentType,
        allowed: Object.keys(AGENTS),
      });
    }

    // Debug response for troubleshooting
    if (req.body?.debug === true) {
      return res.status(200).json({
        debug: true,
        method: req.method,
        headers: req.headers["content-type"] ?? null,
        body: req.body ?? null,
      });
    }

    const input = req.body?.input ?? req.body?.message ?? "";

    const agentFunctions: Partial<Record<AgentKey, Function>> = {
      support: async (input: any) => {
        const prompt = typeof input === "string" ? input : input?.message ?? "How can I help you?";
        const result = await openaiCompletion(prompt);
        return { text: result };
      },
      inbox: mailboxAgent, // Now uses mailboxAgent scaffold
      // Only include AgentKey values defined in AGENTS
      // orchestrator is not an AgentKey, but can be called separately if needed
    };

    const agentFn = agentFunctions[agentType];
    if (!agentFn) {
      return res.status(501).json({ error: `Agent '${agentType}' not implemented.` });
    }

    // For estimator, input should be an object with required fields
    const result = await agentFn(typeof input === "object" ? input : { sqft: 0, product: { name: "" }, accessories: [], userRole: "rep" });
    return res.status(200).json({ ok: true, agentType, result });
  } catch (err: any) {
    // Top-level error boundary: always return JSON
    console.error('API route crashed:', err);
    if (res.headersSent) {
      // If headers already sent, cannot send another response
      return;
    }
    return res.status(500).json({ error: err?.message || 'Unexpected server error.' });
  }
}
