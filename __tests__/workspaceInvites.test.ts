jest.mock("server-only");
jest.mock("@/lib/firebaseAdmin", () => ({
  adminDb: {
    collection: () => ({
      doc: () => ({ set: async () => {}, update: async () => {} }),
      where: () => ({ get: async () => ({ docs: [] }) }),
      limit: () => ({ get: async () => ({ docs: [] }) }),
    }),
    runTransaction: async (fn: any) =>
      fn({
        get: async () => ({ exists: false, data: () => undefined }),
        set: async () => {},
        update: async () => {},
      }),
  },
}));

import { acceptWorkspaceInvite, createWorkspaceInvite, expireWorkspaceInvites } from "@/lib/workspaceInvites";
import { WorkspaceInviteRole } from "@/lib/types";

class FakeDocRef {
  constructor(private db: FakeFirestore, public collectionName: string, public id: string) {}
  get key() {
    return `${this.collectionName}/${this.id}`;
  }
  async get() {
    const data = this.db.store.get(this.key);
    return {
      exists: !!data,
      data: () => (data ? { ...data } : undefined),
      ref: this,
    };
  }
  async set(data: any, options?: { merge?: boolean }) {
    if (options?.merge) {
      const existing = this.db.store.get(this.key) || {};
      this.db.store.set(this.key, { ...existing, ...data });
    } else {
      this.db.store.set(this.key, { ...data });
    }
  }
  async update(patch: any) {
    const existing = this.db.store.get(this.key);
    if (!existing) throw new Error("missing doc for update");
    this.db.store.set(this.key, { ...existing, ...patch });
  }
}

class FakeQuery {
  constructor(private db: FakeFirestore, private collectionName: string, private filters: Array<[string, string, any]> = [], private _limit?: number) {}
  where(field: string, op: string, value: any) {
    return new FakeQuery(this.db, this.collectionName, [...this.filters, [field, op, value]], this._limit);
  }
  limit(n: number) {
    return new FakeQuery(this.db, this.collectionName, this.filters, n);
  }
  async get() {
    const docs = [] as Array<{ id: string; data: () => any; ref: FakeDocRef }>;
    for (const [key, value] of this.db.store.entries()) {
      if (!key.startsWith(`${this.collectionName}/`)) continue;
      const matches = this.filters.every(([field, op, expected]) => {
        const actual = (value as any)[field];
        switch (op) {
          case "==":
            return actual === expected;
          case "<=":
            return actual <= expected;
          case ">=":
            return actual >= expected;
          default:
            throw new Error("Unsupported op in fake query");
        }
      });
      if (!matches) continue;
      const id = key.split("/")[1];
      docs.push({ id, data: () => ({ ...value }), ref: new FakeDocRef(this.db, this.collectionName, id) });
    }
    const limited = typeof this._limit === "number" ? docs.slice(0, this._limit) : docs;
    return { empty: limited.length === 0, docs: limited };
  }
}

class FakeCollection {
  constructor(private db: FakeFirestore, private name: string) {}
  doc(id?: string) {
    const docId = id || `doc_${Math.random().toString(36).slice(2, 10)}`;
    return new FakeDocRef(this.db, this.name, docId);
  }
  where(field: string, op: string, value: any) {
    return new FakeQuery(this.db, this.name, [[field, op, value]]);
  }
  limit(n: number) {
    return new FakeQuery(this.db, this.name, [], n);
  }
}

class FakeTransaction {
  constructor(private db: FakeFirestore) {}
  async get(ref: FakeDocRef) {
    return ref.get();
  }
  set(ref: FakeDocRef, data: any, options?: { merge?: boolean }) {
    return ref.set(data, options);
  }
  update(ref: FakeDocRef, data: any) {
    return ref.update(data);
  }
}

class FakeFirestore {
  store = new Map<string, any>();
  collection(name: string) {
    return new FakeCollection(this, name);
  }
  async runTransaction<T>(fn: (txn: FakeTransaction) => Promise<T>) {
    const txn = new FakeTransaction(this);
    return fn(txn);
  }
}

describe("workspaceInvites", () => {
  const workspaceId = "ws_123";
  const invitedBy = "user_inviter";
  const inviteeId = "user_acceptor";
  const role: WorkspaceInviteRole = "member";

  it("creates and accepts an invite, provisioning membership", async () => {
    const db = new FakeFirestore();
    const { token, inviteId, expiresAt } = await createWorkspaceInvite({
      workspaceId,
      email: "test@example.com",
      role,
      invitedBy,
      db,
    });
    expect(typeof token).toBe("string");
    expect(expiresAt).toBeGreaterThan(Date.now());

    const { memberId } = await acceptWorkspaceInvite({ workspaceId, token, userId: inviteeId, db });
    const memberSnap = await db.collection("workspace_members").doc(memberId).get();
    expect(memberSnap.exists).toBe(true);
    const memberData = memberSnap.data() as any;
    expect(memberData.role).toBe(role);
    expect(memberData.invitedByUserId).toBe(invitedBy);

    const inviteSnap = await db.collection("workspace_invites").doc(inviteId).get();
    expect((inviteSnap.data() as any).status).toBe("accepted");
  });

  it("rejects expired invites", async () => {
    const db = new FakeFirestore();
    const { token } = await createWorkspaceInvite({
      workspaceId,
      email: "late@example.com",
      role,
      invitedBy,
      expiresAtMs: Date.now() - 1_000,
      db,
    });
    await expect(acceptWorkspaceInvite({ workspaceId, token, userId: inviteeId, db })).rejects.toThrow("Invite expired");
  });

  it("rejects revoked invites", async () => {
    const db = new FakeFirestore();
    const { token, inviteId } = await createWorkspaceInvite({
      workspaceId,
      email: "revoked@example.com",
      role,
      invitedBy,
      db,
    });
    const inviteRef = db.collection("workspace_invites").doc(inviteId);
    await inviteRef.update({ status: "revoked" });
    await expect(acceptWorkspaceInvite({ workspaceId, token, userId: inviteeId, db })).rejects.toThrow("Invite revoked");
  });

  it("validates roles on create", async () => {
    const db = new FakeFirestore();
    await expect(createWorkspaceInvite({ workspaceId, email: "bad@example.com", role: "bad" as any, invitedBy, db })).rejects.toThrow(
      "Invalid role"
    );
  });

  it("expires pending invites in bulk", async () => {
    const db = new FakeFirestore();
    const now = Date.now();
    await createWorkspaceInvite({ workspaceId, email: "old@example.com", role, invitedBy, expiresAtMs: now - 100, db });
    await createWorkspaceInvite({ workspaceId, email: "fresh@example.com", role, invitedBy, expiresAtMs: now + 86_400_000, db });

    const result = await expireWorkspaceInvites({ now, db });
    expect(result.expired).toBe(1);

    const snap = await db
      .collection("workspace_invites")
      .where("status", "==", "expired")
      .limit(10)
      .get();
    expect(snap.docs.length).toBe(1);
  });
});
