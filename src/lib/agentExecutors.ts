export type AgentExecuteArgs = {
  workspaceId: string;
  instruction: string;
  context: any;
  stepIndex: number;
  stepId: string;
};

export type AgentExecuteResult = {
  output: any; // what the agent produced
  contextPatch?: any; // merge into run.context for downstream steps
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
  usdCost?: number; // optional cost attribution for the run
};

export type AgentExecutor = (args: AgentExecuteArgs) => Promise<AgentExecuteResult>;

/**
 * Replace these with your real agent implementations.
 * The runner is real; these are stubs that keep the system functioning.
 */
const executors: Record<string, AgentExecutor> = {
  "system.echo": async ({ instruction, context }) => {
    return {
      output: { echoed: instruction, contextSeen: context ?? {} },
      contextPatch: { lastEcho: instruction },
    };
  },

  // Example: "sales.follow_up" could write a draft SMS/email task into notifications
  "sales.follow_up": async ({ instruction }) => {
    return {
      output: { draftedFollowUp: `FOLLOW-UP DRAFT: ${instruction}` },
      contextPatch: { followUpDrafted: true },
    };
  },
};

export function getAgentExecutor(agentType: string): AgentExecutor {
  const exec = executors[agentType];
  if (!exec) {
    // Safe fallback so runs don't crash forever if a new agent type appears.
    return async ({ instruction }) => ({
      output: { note: "No executor registered for agentType", agentType, instruction },
      contextPatch: {},
    });
  }
  return exec;
}
