// Real agent executor that calls OpenAI/Anthropic and returns structured results
import type { AgentExecutor, AgentExecutorResult } from "./orchestrator";
import type { AgentInstance, AgentQueueItem } from "../lib/types";

// Placeholder for your actual LLM client (OpenAI, Anthropic, etc.)
interface LLMClient {
  chat(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature: number;
    maxTokens: number;
  }): Promise<{
    content: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  }>;
}

export class OpenAIAgentExecutor implements AgentExecutor {
  constructor(private readonly llmClient: LLMClient) {}

  async execute(job: AgentQueueItem, agent: AgentInstance): Promise<AgentExecutorResult> {
    const steps: Array<{ order: number; type: string; name: string; data: Record<string, unknown> }> = [];

    try {
      // Step 1: Construct prompt from agent config + job payload
      steps.push({
        order: 0,
        type: "thought",
        name: "prepare_context",
        data: {
          agentType: agent.agentType,
          jobType: job.jobType,
          payloadKeys: Object.keys(job.payload),
        },
      });

      const systemPrompt = this.buildSystemPrompt(agent);
      const userPrompt = this.buildUserPrompt(job);

      // Step 2: Call LLM
      steps.push({
        order: 1,
        type: "tool_call",
        name: "llm_invoke",
        data: { model: agent.config.tone, temperature: agent.config.temperature },
      });

      const response = await this.llmClient.chat({
        model: "gpt-4", // or agent.config.model if you store it
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: agent.config.temperature,
        maxTokens: agent.config.maxTokens,
      });

      steps.push({
        order: 2,
        type: "tool_result",
        name: "llm_response",
        data: { contentLength: response.content.length, usage: response.usage },
      });

      // Step 3: Parse output (you might have structured JSON parsing here)
      const output = this.parseOutput(response.content);

      steps.push({
        order: 3,
        type: "decision",
        name: "output_validated",
        data: { hasOutput: !!output },
      });

      // Calculate cost (rough estimate: $0.03/1k input, $0.06/1k output for GPT-4)
      const costUsd =
        (response.usage.promptTokens / 1000) * 0.03 + (response.usage.completionTokens / 1000) * 0.06;

      return {
        status: "succeeded",
        output,
        usage: {
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          costUsd,
        },
        steps,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      steps.push({
        order: steps.length,
        type: "decision",
        name: "execution_failed",
        data: { error: error.message },
      });

      return {
        status: "failed",
        error: {
          code: "execution_error",
          message: error.message,
          retriable: this.isRetriable(error),
        },
        steps,
      };
    }
  }

  private buildSystemPrompt(agent: AgentInstance): string {
    return `You are an AI agent of type "${agent.agentType}" named "${agent.name}".
Your role: ${agent.name}
Tone: ${agent.config.tone}
Guardrails:
- Can send SMS: ${agent.guardrails.canSendSms}
- Can email: ${agent.guardrails.canEmail}
- Can create estimates: ${agent.guardrails.canCreateEstimates}
- Can edit prices: ${agent.guardrails.canEditPrices}

Follow the user's instructions carefully and respond with valid JSON output.`;
  }

  private buildUserPrompt(job: AgentQueueItem): string {
    return `Job Type: ${job.jobType}
Payload:
${JSON.stringify(job.payload, null, 2)}

Please process this job and return a JSON object with the result.`;
  }

  private parseOutput(content: string): Record<string, unknown> | null {
    // Attempt to extract JSON from content (you might use a regex or structured output)
    try {
      // Try to parse the entire content as JSON
      return JSON.parse(content);
    } catch {
      // If not pure JSON, try to extract JSON block from markdown code fence
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      // Fallback: return raw content as text output
      return { raw: content };
    }
  }

  private isRetriable(error: Error): boolean {
    // Retry on rate limits, timeouts, 5xx errors
    const message = error.message.toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("timeout") ||
      message.includes("503") ||
      message.includes("502") ||
      message.includes("500")
    );
  }
}

// Mock executor for testing/development
export class MockAgentExecutor implements AgentExecutor {
  async execute(job: AgentQueueItem, agent: AgentInstance): Promise<AgentExecutorResult> {
    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      status: "succeeded",
      output: {
        mockResult: true,
        jobType: job.jobType,
        agentType: agent.agentType,
        processedAt: Date.now(),
      },
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costUsd: 0.001,
      },
      steps: [
        { order: 0, type: "thought", name: "mock_processing", data: { jobId: job.id } },
        { order: 1, type: "output", name: "mock_complete", data: { success: true } },
      ],
    };
  }
}

// Factory to create the appropriate executor based on environment
export function createAgentExecutor(llmClient?: LLMClient): AgentExecutor {
  if (process.env.NODE_ENV === "test" || !llmClient) {
    return new MockAgentExecutor();
  }
  return new OpenAIAgentExecutor(llmClient);
}
