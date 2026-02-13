import { createMocks } from "node-mocks-http";
import { POST } from "./route";

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(() => Promise.resolve()),
      })),
      add: jest.fn(() => Promise.resolve()),
    })),
  },
}));

jest.mock("@/lib/audit/billing", () => ({
  writeBillingAuditLog: jest.fn(() => Promise.resolve()),
}));

describe("POST /api/stripe/webhook", () => {
  it("returns 400 if missing signature", async () => {
    const { req } = createMocks({ method: "POST" });
    // @ts-expect-error: POST expects NextRequest, not a plain req
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("returns 400 if invalid signature", async () => {
    const { req } = createMocks({
      method: "POST",
      headers: { "stripe-signature": "bad" },
      body: {},
    });
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    // Mock Stripe
    jest
      .spyOn(
        (await import("stripe")).default.prototype.webhooks,
        "constructEvent",
      )
      .mockImplementation(() => {
        throw new Error("Invalid signature");
      });
    // @ts-expect-error: POST expects NextRequest, not a plain req
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  // Add more tests for event types as needed
});
