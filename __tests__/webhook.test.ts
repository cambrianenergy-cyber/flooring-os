jest.mock('../src/lib/billing', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(() => ({ id: 'evt_test', type: 'test.event', data: { object: {} } }))
    },
    customers: {
      retrieve: jest.fn(() => ({ metadata: { workspaceId: 'ws_test' } }))
    }
  }
}));

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
});
import { handleStripeWebhook } from "../src/lib/stripeWebhookHandler";

describe("Stripe Webhook Handler", () => {
  it("returns 400 if signature is missing", async () => {
    const req = {
      headers: { get: () => null },
      arrayBuffer: async () => new ArrayBuffer(0)
    } as unknown as Request;
    const res = await handleStripeWebhook(req);
    expect(res.status).toBe(400);
  });

  it("returns 500 if secret is missing", async () => {
    const oldSecret = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const req = {
      headers: { get: () => "sig" },
      arrayBuffer: async () => new ArrayBuffer(0)
    } as unknown as Request;
    const res = await handleStripeWebhook(req);
    expect(res.status).toBe(500);
    process.env.STRIPE_WEBHOOK_SECRET = oldSecret;
  });

  // Add more tests for valid event, duplicate event, etc.
});
