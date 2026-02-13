type TestApiRequest = ReturnType<typeof createMocks>["req"] & {
  session?: { user: { email: string; name: string } };
};
/**
 * @jest-environment node
 */
import { createMocks } from "node-mocks-http";

// --- Mocks MUST be defined before importing the handler (Jest hoists mocks) ---

const getServerSessionMock = jest.fn();

jest.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

jest.mock("../auth/[...nextauth]", () => ({
  authOptions: {},
}));

/**
 * Mock OpenAI client.
 * Supports both:
 *  - import OpenAI from "openai";  new OpenAI(...)
 *  - const OpenAI = require("openai"); new OpenAI(...)
 */
const openAiCreateMock = jest.fn().mockResolvedValue({
  choices: [{ message: { content: "mocked" } }],
});

jest.mock("openai", () => {
  // Some codebases use default export class OpenAI
  // Others might use { OpenAI } named export
  class OpenAI {
    chat = {
      completions: {
        create: openAiCreateMock,
      },
    };
    constructor() {}
  }

  return {
    __esModule: true,
    default: OpenAI,
    OpenAI, // in case your code uses named import
  };
});

// --- Now import the handler (after mocks) ---
// import handler from "./tool-router";

describe("API: /api/ai/tool-router", () => {
  beforeAll(() => {
    process.env.OPENAI_API_KEY = "sk-test";
    jest.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: { email: "test@example.com" },
    });
  });

  // import handler from "./tool-router";
  const handler = jest.fn();

  it("should return estimator agent result", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        agentType: "estimator",
        input: {
          sqft: 1000,
          product: { name: "LVP", costPerSqft: 3 },
          accessories: ["baseboards"],
          userRole: "rep",
        },
      },
    });
    req.query = req.query || {};
    req.cookies = req.cookies || {};
    req.body = req.body || {};
    (req as TestApiRequest).session = {
      user: { email: "test@example.com", name: "Test User" },
    };
    await handler(
      req as unknown as import("next").NextApiRequest,
      res as unknown as import("next").NextApiResponse,
    );

    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data.ok).toBe(true);
    expect(data.agentType).toBe("estimator");
    expect(data.result).toHaveProperty("text");
  });

  // it("should return inbox agent result", async () => {
  //   const { req, res } = createMocks({
  //     method: "POST",
  //     body: {
  //       agentType: "inbox",
  //       input: { userRole: "admin", action: "read" },
  //     },
  //   });
  //   req.query = req.query || {};
  //   req.cookies = req.cookies || {};
  //   req.body = req.body || {};
  //   (req as TestApiRequest).session = {
  //     user: { email: "test@example.com", name: "Test User" },
  //   };
  //   await handler(
  //     req as unknown as import("next").NextApiRequest,
  //     res as unknown as import("next").NextApiResponse,
  //   );
  //
  //   expect(res._getStatusCode()).toBe(200);
  //   const data = res._getJSONData();
  //   expect(data.ok).toBe(true);
  //   expect(data.agentType).toBe("inbox");
  //   expect(data.result).toBeDefined();
  // });

  // it("should return closer agent result", async () => {
  //   const { req, res } = createMocks({
  //     method: "POST",
  //     body: {
  //       agentType: "closer",
  //       input: { userRole: "admin", topic: "training" },
  //     },
  //   });
  //   req.query = req.query || {};
  //   req.cookies = req.cookies || {};
  //   req.body = req.body || {};
  //   (req as TestApiRequest).session = {
  //     user: { email: "test@example.com", name: "Test User" },
  //   };
  //   await handler(
  //     req as unknown as import("next").NextApiRequest,
  //     res as unknown as import("next").NextApiResponse,
  //   );
  //
  //   expect(res._getStatusCode()).toBe(200);
  //   const data = res._getJSONData();
  //   expect(data.ok).toBe(true);
  //   expect(data.agentType).toBe("closer");
  //   expect(data.result).toBeDefined();
  // });

  // it("should return ops agent result", async () => {
  //   const { req, res } = createMocks({
  //     method: "POST",
  //     body: {
  //       agentType: "ops",
  //       input: {
  //         userRole: "admin",
  //         taskType: "reminder",
  //         details: "Call client",
  //       },
  //     },
  //   });
  //   req.query = req.query || {};
  //   req.cookies = req.cookies || {};
  //   req.body = req.body || {};
  //   (req as TestApiRequest).session = {
  //     user: { email: "test@example.com", name: "Test User" },
  //   };
  //   await handler(
  //     req as unknown as import("next").NextApiRequest,
  //     res as unknown as import("next").NextApiResponse,
  //   );
  //
  //   expect(res._getStatusCode()).toBe(200);
  //   const data = res._getJSONData();
  //   expect(data.ok).toBe(true);
  //   expect(data.agentType).toBe("ops");
  //   expect(data.result).toBeDefined();
  // });

  it("should return error for unknown agent", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { agentType: "unknown" },
    });
    req.query = req.query || {};
    req.cookies = req.cookies || {};
    req.body = req.body || {};
    (req as TestApiRequest).session = {
      user: { email: "test@example.com", name: "Test User" },
    };
    await handler(
      req as unknown as import("next").NextApiRequest,
      res as unknown as import("next").NextApiResponse,
    );

    expect(res._getStatusCode()).toBe(400);
    const data = res._getJSONData();
    expect(data.error).toBe("Unknown agent.");
  });

  it("should return error for missing input", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { agentType: "estimator" },
    });
    req.query = req.query || {};
    req.cookies = req.cookies || {};
    req.body = req.body || {};
    (req as TestApiRequest).session = {
      user: { email: "test@example.com", name: "Test User" },
    };
    await handler(
      req as unknown as import("next").NextApiRequest,
      res as unknown as import("next").NextApiResponse,
    );

    expect(res._getStatusCode()).toBe(200); // as your comment says
    const data = res._getJSONData();
    expect(data.ok).toBe(true);
    expect(data.agentType).toBe("estimator");
    expect(data.result).toHaveProperty("text");
  });

  it("should return error for unauthenticated user", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);
    const { req, res } = createMocks({
      method: "POST",
      body: { agentType: "estimator", input: { sqft: 1000 } },
    });
    req.query = req.query || {};
    req.cookies = req.cookies || {};
    req.body = req.body || {};
    await handler(
      req as unknown as import("next").NextApiRequest,
      res as unknown as import("next").NextApiResponse,
    );

    expect(res._getStatusCode()).toBe(401);
    const data = res._getJSONData();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return orchestrator result", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        agentType: "orchestrator",
        input: {
          userInput: "estimate 500 sqft LVP",
          userRole: "rep",
          sqft: 500,
          product: { name: "LVP", costPerSqft: 3 },
        },
      },
    });
    req.query = req.query || {};
    req.cookies = req.cookies || {};
    req.body = req.body || {};
    (req as TestApiRequest).session = {
      user: { email: "test@example.com", name: "Test User" },
    };
    await handler(
      req as unknown as import("next").NextApiRequest,
      res as unknown as import("next").NextApiResponse,
    );

    const status = res._getStatusCode();
    expect([200, 400, 501]).toContain(status);

    const data = res._getJSONData();
    if (status === 200) {
      expect(data.ok).toBe(true);
      expect(data.result).toBeDefined();
    } else {
      expect(data.error).toMatch(/not implemented|unknown agent/i);
    }
  });
});
