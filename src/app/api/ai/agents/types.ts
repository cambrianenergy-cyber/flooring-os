// Type definitions for AI agent metadata

export interface AgentMeta {
  id: string;
  name: string;
  description: string;
  icon?: string;
  tags?: string[];
  [key: string]: any;
}
