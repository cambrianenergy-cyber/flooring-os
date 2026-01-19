import { AI_COLLECTION_SCHEMAS, AiCollectionKey } from "../src/lib/aiCollectionsSchema";

describe("AI collection schemas", () => {
  const expectedKeys: AiCollectionKey[] = [
    "agent_runs",
    "agent_logs",
    "agent_permissions",
    "agent_memory",
    "agent_tasks",
    "agent_tools",
    "agent_approvals",
    "agent_prompt_versions",
    "agent_events",
    "workspace_knowledge",
    "agent_evals",
    "workflow_triggers",
    "workflow_conditions",
    "workflow_failures",
  ];

  it("covers all required collections", () => {
    const keys = Object.keys(AI_COLLECTION_SCHEMAS).sort();
    expect(keys).toEqual([...expectedKeys].sort());
  });

  it("defines required fields for every collection", () => {
    expectedKeys.forEach((key) => {
      const schema = AI_COLLECTION_SCHEMAS[key];
      expect(schema).toBeDefined();
      expect(schema.required.length).toBeGreaterThan(0);
      const uniqueRequired = new Set(schema.required as string[]);
      expect(uniqueRequired.size).toBe(schema.required.length);
    });
  });

  it("does not leave required fields empty", () => {
    Object.entries(AI_COLLECTION_SCHEMAS).forEach(([key, schema]) => {
      schema.required.forEach((field) => {
        expect(typeof field).toBe("string");
        expect((field as string).length).toBeGreaterThan(0);
      });
    });
  });
});
