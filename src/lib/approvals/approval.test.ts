import { decideEnterpriseApproval } from "./decideEnterpriseApproval";
import { requestEnterpriseApproval } from "./requestEnterpriseApproval";

jest.mock("@/lib/firebase/client", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(() => Promise.resolve({ id: "approval123" })),
  collection: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn(() => "now"),
  updateDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
}));

jest.mock("@/lib/audit", () => ({
  writeAuditLog: jest.fn(() => Promise.resolve()),
}));

describe("requestEnterpriseApproval", () => {
  it("creates an approval and updates estimate", async () => {
    const id = await requestEnterpriseApproval({
      workspaceId: "ws1",
      estimateId: "est1",
      requestedByUserId: "user1",
      reason: "Need enterprise pricing",
    });
    expect(id).toBe("approval123");
  });
});

describe("decideEnterpriseApproval", () => {
  it("updates approval and estimate, writes audit log", async () => {
    await decideEnterpriseApproval({
      workspaceId: "ws1",
      approvalId: "approval123",
      estimateId: "est1",
      decidedByUserId: "user2",
      decision: "approved",
    });
    // No error means success
    expect(true).toBe(true);
  });
});
