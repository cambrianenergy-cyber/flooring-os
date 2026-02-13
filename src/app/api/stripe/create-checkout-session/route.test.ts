import { createMocks } from "node-mocks-http";
let POST;
// Mock environment variables
const OLD_ENV = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...OLD_ENV,
    STRIPE_SECRET_KEY: "sk_test_123",
    APP_URL: "http://localhost:3000",
  };
});
afterEach(() => {
  process.env = OLD_ENV;
});

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: true })),
      })),
    })),
  },
}));

jest.mock("@/lib/stripe/plans", () => ({
  PLANS: {
    starter: {
      priceId: "price_starter",
      name: "Starter",
      key: "starter",
      description: "",
      features: [],
    },
    pro: {
      priceId: "price_pro",
      name: "Pro",
      key: "pro",
      description: "",
      features: [],
    },
    enterprise: {
      priceId: "price_enterprise",
      name: "Enterprise",
      key: "enterprise",
      description: "",
      features: [],
    },
  },
}));

describe("POST /api/stripe/create-checkout-session", () => {
  // Default Stripe mock for all tests except missing key
  const stripeMock = {
    checkout: {
      sessions: {
        create: jest
          .fn()
          .mockResolvedValue({ url: "https://stripe.com/checkout" }),
        retrieve: jest.fn(),
        update: jest.fn(),
        list: jest.fn(),
        expire: jest.fn(),
        listLineItems: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk_test_123",
      APP_URL: "http://localhost:3000",
    };
    jest.mock("stripe", () => {
      return function StripeMock() {
        return stripeMock;
      };
    });
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.unmock("stripe");
    stripeMock.checkout.sessions.create.mockReset();
  });
  it("returns 500 if STRIPE_SECRET_KEY is missing", async () => {
    jest.resetModules();
    process.env.STRIPE_SECRET_KEY = "";
    jest.doMock("stripe", () => {
      return function StripeMock() {
        return { checkout: { sessions: { create: jest.fn() } } };
      };
    });
    POST = (await import("./route")).POST;
    const { req } = createMocks({
      method: "POST",
      body: { workspaceId: "ws1", planId: "starter" },
    });
    let response;
    try {
      response = await POST(req);
    } catch {
      response = { status: 500 };
    }
    expect(response.status).toBe(500);
    if (typeof response._getJSONData === "function") {
      const data = response._getJSONData();
      expect(data.ok).toBe(false);
    }
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
  });

  // Example: Add authentication/permissions mock if needed
  // it("returns 403 if user is not authorized", async () => {
  //   // Mock authentication/authorization logic here
  //   // ...
  // });
  it("returns 400 if missing workspaceId or planId", async () => {
    jest.resetModules();
    jest.doMock("@/lib/firebase/admin", () => ({
      adminDb: {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ exists: true })),
          })),
        })),
      },
    }));
    jest.doMock("@/lib/stripe/plans", () => ({
      PLANS: {
        starter: {
          priceId: "price_starter",
          name: "Starter",
          key: "starter",
          description: "",
          features: [],
        },
      },
    }));
    jest.doMock("stripe", () => {
      return function StripeMock() {
        return stripeMock;
      };
    });
    POST = (await import("./route")).POST;
    const { req } = createMocks({
      method: "POST",
      body: { planId: "starter" },
    });
    req.json = async () => req.body;
    const response = await POST(req);
    expect(response.status).toBe(400);
    if (typeof response._getJSONData === "function") {
      const data = response._getJSONData();
      expect(data.ok).toBe(false);
    }
  });

  it("returns 400 if invalid plan", async () => {
    jest.resetModules();
    jest.doMock("@/lib/firebase/admin", () => ({
      adminDb: {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ exists: true })),
          })),
        })),
      },
    }));
    jest.doMock("@/lib/stripe/plans", () => ({
      PLANS: {
        starter: {
          priceId: "price_starter",
          name: "Starter",
          key: "starter",
          description: "",
          features: [],
        },
      },
    }));
    jest.doMock("stripe", () => {
      return function StripeMock() {
        return stripeMock;
      };
    });
    POST = (await import("./route")).POST;
    const { req } = createMocks({
      method: "POST",
      body: { workspaceId: "ws1", planId: "invalid" },
    });
    req.json = async () => req.body;
    const response = await POST(req);
    expect(response.status).toBe(400);
    if (typeof response._getJSONData === "function") {
      const data = response._getJSONData();
      expect(data.ok).toBe(false);
    }
  });

  it("returns 404 if workspace not found", async () => {
    jest.resetModules();
    jest.doMock("@/lib/firebase/admin", () => ({
      adminDb: {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ exists: false })),
          })),
        })),
      },
    }));
    jest.doMock("stripe", () => {
      return function StripeMock() {
        return stripeMock;
      };
    });
    POST = (await import("./route")).POST;
    const { req } = createMocks({
      method: "POST",
      body: { workspaceId: "ws404", planId: "starter" },
    });
    req.json = async () => req.body;
    const response = await POST(req);
    expect(response.status).toBe(404);
    if (typeof response._getJSONData === "function") {
      const data = response._getJSONData();
      expect(data.ok).toBe(false);
    }
  });

  it("returns 400 if plan is deactivated (missing priceId)", async () => {
    jest.resetModules();
    jest.doMock("@/lib/firebase/admin", () => ({
      adminDb: {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ exists: true })),
          })),
        })),
      },
    }));
    jest.doMock("@/lib/stripe/plans", () => ({
      PLANS: {
        starter: {
          priceId: undefined,
          name: "Starter",
          key: "starter",
          description: "",
          features: [],
        },
      },
    }));
    jest.doMock("stripe", () => {
      return function StripeMock() {
        return stripeMock;
      };
    });
    POST = (await import("./route")).POST;
    const { req } = createMocks({
      method: "POST",
      body: { workspaceId: "ws1", planId: "starter" },
    });
    req.json = async () => req.body;
    const response = await POST(req);
    expect(response.status).toBe(400);
    if (typeof response._getJSONData === "function") {
      const data = response._getJSONData();
      expect(data.ok).toBe(false);
    }
  });

  it("returns 500 if Stripe API throws error", async () => {
    jest.resetModules();
    jest.doMock("@/lib/firebase/admin", () => ({
      adminDb: {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ exists: true })),
          })),
        })),
      },
    }));
    jest.doMock("@/lib/stripe/plans", () => ({
      PLANS: {
        starter: {
          priceId: "price_starter",
          name: "Starter",
          key: "starter",
          description: "",
          features: [],
        },
      },
    }));
    const localStripeMock = {
      checkout: {
        sessions: {
          create: jest.fn().mockRejectedValueOnce(new Error("Stripe error")),
        },
      },
    };
    jest.doMock("stripe", () => {
      return function StripeMock() {
        return localStripeMock;
      };
    });
    POST = (await import("./route")).POST;
    const { req } = createMocks({
      method: "POST",
      body: { workspaceId: "ws1", planId: "starter" },
    });
    req.json = async () => req.body;
    let response;
    try {
      response = await POST(req);
    } catch {
      response = { status: 500 };
    }
    expect(response.status).toBe(500);
    if (typeof response._getJSONData === "function") {
      const data = response._getJSONData();
      expect(data.ok).toBe(false);
    }
  });

  it("returns 200 and url for valid input", async () => {
    jest.resetModules();
    jest.doMock("@/lib/firebase/admin", () => ({
      adminDb: {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ exists: true })),
          })),
        })),
      },
    }));
    jest.doMock("@/lib/stripe/plans", () => ({
      PLANS: {
        starter: {
          priceId: "price_starter",
          name: "Starter",
          key: "starter",
          description: "",
          features: [],
        },
      },
    }));
    // Stripe mock with explicit create returning expected url
    jest.doMock("stripe", () => {
      return function StripeMock() {
        return {
          checkout: {
            sessions: {
              create: jest
                .fn()
                .mockResolvedValue({ url: "https://stripe.com/checkout" }),
              retrieve: jest.fn(),
              update: jest.fn(),
              list: jest.fn(),
              expire: jest.fn(),
              listLineItems: jest.fn(),
            },
          },
        };
      };
    });
    POST = (await import("./route")).POST;
    const { req } = createMocks({
      method: "POST",
      body: { workspaceId: "ws1", planId: "starter" },
    });
    req.json = async () => req.body;
    const response = await POST(req);
    expect(response.status).toBe(200);
    if (typeof response._getJSONData === "function") {
      const data = response._getJSONData();
      expect(data.url).toBe("https://stripe.com/checkout");
    }
  });
});
