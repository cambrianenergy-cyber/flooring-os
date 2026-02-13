import { Readable } from "stream";

// --- Firestore Mock Classes ---

export class FakeFirestore {
  bundle() {
    return { add: () => {}, build: () => ({}) };
  }
  store = new Map<string, Record<string, unknown>>();
  collection(name: string) {
    return new FakeCollection(this, name);
  }
  async runTransaction(fn: (txn: FakeTransaction) => Promise<unknown>) {
    const txn = new FakeTransaction();
    return fn(txn);
  }
  settings() {
    return {};
  }
  databaseId = "fake/(default)";
  doc(collectionPath: string, docId?: string) {
    let collectionName = collectionPath;
    let id = docId;
    if (!docId && collectionPath.includes("/")) {
      const parts = collectionPath.split("/");
      collectionName = parts[0];
      id = parts[1];
    }
    return new FakeDocRef(this, collectionName, id || "doc1");
  }
  collectionGroup() {
    return new FakeCollection(this, "group");
  }
  app = { name: "fakeApp" };
  type = "firestore";
  async getAll(...refs: FakeDocRef[]) {
    return Promise.all(refs.map((ref) => ref.get()));
  }
  async recursiveDelete() {
    return Promise.resolve();
  }
  async terminate() {
    return Promise.resolve();
  }
  async listCollections() {
    const collections = new Set<string>();
    for (const key of this.store.keys()) {
      const [collection] = key.split("/");
      collections.add(collection);
    }
    return Array.from(collections).map(
      (name) => new FakeCollection(this, name),
    );
  }
  bulkWriter() {
    return {
      create: () => {},
      set: () => {},
      update: () => {},
      delete: () => {},
      close: async () => {},
      onWriteError: () => {},
    };
  }
  batch() {
    return {
      set: () => {},
      update: () => {},
      delete: () => {},
      commit: async () => {},
    };
  }
}

export class FakeCollection {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPartitions(_desiredPartitionCount?: number) {
    return { async *[Symbol.asyncIterator]() {} };
  }
  id = "";
  parent = null;
  path = "";
  firestore = null as unknown as FakeFirestore;
  type = "collection";
  private db: FakeFirestore;
  public name: string;
  constructor(db: FakeFirestore, name: string) {
    this.db = db;
    this.name = name;
    this.id = name;
    this.path = name;
  }
  doc(id?: string) {
    const docId = id || `doc_${Math.random().toString(36).slice(2, 10)}`;
    return new FakeDocRef(this.db, this.name, docId);
  }
  where(fieldOrFilter: unknown, opStr?: unknown, value?: unknown) {
    if (
      typeof fieldOrFilter === "string" &&
      opStr !== undefined &&
      value !== undefined
    ) {
      return new FakeQuery(this.db, this.name, [
        [fieldOrFilter, opStr as string, value],
      ]);
    } else {
      return new FakeQuery(this.db, this.name, []);
    }
  }
  limit(n: number) {
    return new FakeQuery(this.db, this.name, [], n);
  }
  async listDocuments() {
    return [];
  }
  async add(data: Record<string, unknown>) {
    const docRef = this.doc();
    await docRef.set(data);
    return docRef;
  }
  isEqual(other: unknown) {
    return other === this;
  }
  withConverter() {
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  limitToLast(_n: number) {
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  offset(_n: number) {
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  select(..._fields: string[]) {
    return new FakeQuery(this.db, this.name, []);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startAt(..._args: unknown[]) {
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startAfter(..._args: unknown[]) {
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  endAt(..._args: unknown[]) {
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  endBefore(..._args: unknown[]) {
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  orderBy(_field: string, _direction?: "asc" | "desc") {
    return this;
  }
  async get() {
    const docs: Array<{
      id: string;
      data: () => Record<string, unknown>;
      ref: FakeDocRef;
      exists: boolean;
      createTime: FakeTimestamp;
      updateTime: FakeTimestamp;
      readTime: FakeTimestamp;
      isEqual: () => boolean;
      metadata: Record<string, unknown>;
      get: (fieldPath: string) => unknown;
    }> = [];
    for (const [key, value] of this.db.store.entries()) {
      if (!key.startsWith(`${this.name}/`)) continue;
      const id = key.split("/")[1];
      docs.push({
        id,
        data: () => ({ ...value }),
        ref: new FakeDocRef(this.db, this.name, id),
        exists: true,
        createTime: FakeTimestamp.fromDate(new Date()),
        updateTime: FakeTimestamp.fromDate(new Date()),
        readTime: FakeTimestamp.fromDate(new Date()),
        isEqual: () => false,
        metadata: {},
        get: (fieldPath: string) =>
          (value as Record<string, unknown>)[fieldPath],
      });
    }
    return {
      empty: docs.length === 0,
      docs,
      size: docs.length,
      query: this,
      readTime: FakeTimestamp.fromDate(new Date()),
      docChanges: () => [],
      forEach: (callback: (doc: (typeof docs)[0]) => void) => {
        docs.forEach((doc) => callback(doc));
      },
      isEqual: () => false,
      metadata: {},
      data: () => ({ count: docs.length }),
    };
  }
  explain() {
    return Promise.resolve({
      metrics: {
        planSummary: "Fake query plan",
        executionStats: {
          resultsReturned: 0,
          executionDuration: { seconds: 0, nanoseconds: 0, milliseconds: 0 },
          readOperations: 0,
          debugStats: {},
        },
        query: this,
        readTime: FakeTimestamp.fromDate(new Date()),
        docChanges: () => [],
        forEach: () => {},
        isEqual: () => false,
        metadata: {},
      },
      get: async () => ({ docs: [] }),
    });
  }
  stream() {
    return Readable.from([]);
  }
  explainStream() {
    return Readable.from([]);
  }
  onSnapshot() {
    return () => {};
  }
  count() {
    return {
      query: this,
      explain: () => Promise.resolve({}),
      isEqual: () => false,
      get: async () => ({
        query: this,
        readTime: FakeTimestamp.fromDate(new Date()),
        isEqual: () => false,
        data: () => ({ count: 0 }),
      }),
    };
  }
  aggregate() {
    return { get: async () => ({}) };
  }
  findNearest() {
    return { get: async () => ({ docs: [] }) };
  }
}

export class FakeDocRef {
  // Common Firestore DocumentReference properties
  parent: FakeCollection | null = null;
  // Firestore expects a 'firestore' property
  firestore: FakeFirestore;
  // Firestore expects a 'path' property
  path: string;
  // Firestore expects a 'id' property
  id: string;
  // Firestore expects a 'type' property
  // Add 'withConverter' method
  withConverter() {
    return this;
  }
  // Add 'isEqual' method
  isEqual(other: unknown) {
    return other === this;
  }
  // Add 'onSnapshot' method
  onSnapshot() {
    return () => {};
  }
  // Add 'create' method
  async create() {
    return this;
  }
  // Add 'delete' method
  async delete() {
    this.db.store.delete(this.key);
  }
  // Add 'set' method
  async set(data: Record<string, unknown>, options?: { merge?: boolean }) {
    if (options?.merge) {
      const existing = this.db.store.get(this.key) || {};
      this.db.store.set(this.key, { ...existing, ...data });
    } else {
      this.db.store.set(this.key, { ...data });
    }
  }
  // Add 'get' method
  async get() {
    const data = this.db.store.get(this.key);
    return {
      exists: !!data,
      data: () => (data ? { ...data } : undefined),
      ref: this,
    };
  }
  // Add 'update' method
  async update(patch: Record<string, unknown>) {
    const existing = this.db.store.get(this.key);
    if (!existing) throw new Error("missing doc for update");
    this.db.store.set(this.key, { ...existing, ...patch });
  }
  // Add 'listCollections' method
  async listCollections() {
    return [];
  }
  // Add 'collection' method
  collection(collectionPath: string) {
    return new FakeCollection(this.db, collectionPath);
  }
  // Add 'explain' method
  explain() {
    return Promise.resolve({
      metrics: {
        planSummary: { summary: "Fake query plan", indexesUsed: [] },
        executionStats: {
          resultsReturned: 0,
          executionDuration: { seconds: 0, nanoseconds: 0, milliseconds: 0 },
          readOperations: 0,
          debugStats: {},
        },
      },
      snapshot: {
        empty: true,
        docs: [],
        size: 0,
        query: this,
        readTime: FakeTimestamp.fromDate(new Date()),
        docChanges: () => [],
        forEach: () => {},
        isEqual: () => false,
        metadata: {},
      },
      get: async () => ({ docs: [] }),
    });
  }
  // Internal properties
  private key: string;
  private db: FakeFirestore;
  constructor(db: FakeFirestore, collectionName: string, id: string) {
    this.firestore = db;
    this.path = `${collectionName}/${id}`;
    this.key = `${collectionName}/${id}`;
    this.db = db;
    this.id = id;
  }
}

export class FakeQuery {
  query: FakeQuery = this;
  firestore: FakeFirestore;
  private db: FakeFirestore;
  private collectionName: string;
  private filters: Array<[string, string, unknown]> = [];
  private _limit?: number;

  constructor(
    db: FakeFirestore,
    collectionName: string,
    filters: Array<[string, string, unknown]> = [],
    _limit?: number,
  ) {
    this.db = db;
    this.collectionName = collectionName;
    this.filters = filters;
    this._limit = _limit;
    this.firestore = db;
  }

  onSnapshot() {
    return () => {};
  }

  aggregate() {
    return { get: async () => ({}) };
  }

  findNearest() {
    return { get: async () => ({ docs: [] }) };
  }

  async get() {
    const docs: Array<{
      id: string;
      data: () => Record<string, unknown>;
      ref: FakeDocRef;
      exists: boolean;
      createTime: FakeTimestamp;
      updateTime: FakeTimestamp;
      readTime: FakeTimestamp;
      isEqual: () => boolean;
      metadata: Record<string, unknown>;
      get: (fieldPath: string) => unknown;
    }> = [];
    for (const [key, value] of this.db.store.entries()) {
      if (!key.startsWith(`${this.collectionName}/`)) continue;
      const matches = this.filters.every(([field, op, expected]) => {
        const actual = (value as Record<string, unknown>)[field];
        switch (op) {
          case "==":
            return actual === expected;
          case "<=":
            return (
              typeof actual === "number" &&
              typeof expected === "number" &&
              actual <= expected
            );
          case ">=":
            return (
              typeof actual === "number" &&
              typeof expected === "number" &&
              actual >= expected
            );
          default:
            throw new Error("Unsupported op in fake query");
        }
      });
      if (!matches) continue;
      const id = key.split("/")[1];
      docs.push({
        id,
        data: () => ({ ...value }),
        ref: new FakeDocRef(this.db, this.collectionName, id),
        exists: true,
        createTime: FakeTimestamp.fromDate(new Date()),
        updateTime: FakeTimestamp.fromDate(new Date()),
        readTime: FakeTimestamp.fromDate(new Date()),
        isEqual: () => false,
        metadata: {},
        get: (fieldPath: string) =>
          (value as Record<string, unknown>)[fieldPath],
      });
    }
    const limited =
      typeof this._limit === "number" ? docs.slice(0, this._limit) : docs;
    return {
      empty: limited.length === 0,
      docs: limited,
      size: limited.length,
      query: this,
      readTime: FakeTimestamp.fromDate(new Date()),
      docChanges: () => [],
      forEach: (callback: (doc: (typeof limited)[0]) => void) => {
        limited.forEach((doc) => callback(doc));
      },
      isEqual: () => false,
      metadata: {},
      data: () => ({ count: limited.length }),
    };
  }

  explain() {
    return Promise.resolve({
      metrics: {
        planSummary: { summary: "Fake query plan", indexesUsed: [] },
        executionStats: {
          resultsReturned: 0,
          executionDuration: { seconds: 0, nanoseconds: 0, milliseconds: 0 },
          readOperations: 0,
          debugStats: {},
        },
      },
      snapshot: {
        empty: true,
        docs: [],
        size: 0,
        query: this,
        readTime: FakeTimestamp.fromDate(new Date()),
        docChanges: () => [],
        forEach: () => {},
        isEqual: () => false,
        metadata: {},
        data: () => ({ count: 0 }),
      },
      get: async () => ({ docs: [] }),
    });
  }

  stream() {
    return Readable.from([]);
  }

  explainStream() {
    return Readable.from([]);
  }

  where(fieldOrFilter: unknown, opStr?: unknown, value?: unknown) {
    if (
      typeof fieldOrFilter === "string" &&
      opStr !== undefined &&
      value !== undefined
    ) {
      return new FakeQuery(
        this.db,
        this.collectionName,
        [
          [
            typeof fieldOrFilter === "string" ? fieldOrFilter : "",
            typeof opStr === "string" ? opStr : "",
            value ?? "",
          ] as [string, string, unknown],
        ],
        this._limit,
      );
    } else {
      return new FakeQuery(
        this.db,
        this.collectionName,
        this.filters,
        this._limit,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  orderBy(_field: string, _direction?: "asc" | "desc") {
    return this;
  }

  limit(n: number) {
    return new FakeQuery(this.db, this.collectionName, this.filters, n);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  limitToLast(_n: number) {
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  offset(_n: number) {
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  select(..._fields: string[]) {
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startAt(..._args: unknown[]) {
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startAfter(..._args: unknown[]) {
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  endAt(..._args: unknown[]) {
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  endBefore(..._args: unknown[]) {
    return this;
  }

  withConverter() {
    return this;
  }

  isEqual(other: unknown) {
    return other === this;
  }

  count() {
    return {
      query: this,
      explain: () => Promise.resolve({}),
      isEqual: () => false,
      get: async () => ({
        query: this,
        readTime: FakeTimestamp.fromDate(new Date()),
        isEqual: () => false,
        data: () => ({ count: 0 }),
      }),
    };
  }
}

export class FakeTimestamp {
  seconds: number;
  nanoseconds: number;
  constructor(date: Date) {
    this.seconds = Math.floor(date.getTime() / 1000);
    this.nanoseconds = (date.getTime() % 1000) * 1e6;
  }
  static now() {
    return new FakeTimestamp(new Date());
  }
  static fromDate(date: Date) {
    return new FakeTimestamp(date);
  }
  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }
  toMillis() {
    return this.seconds * 1000 + this.nanoseconds / 1e6;
  }
  valueOf() {
    return this.toMillis().toString();
  }
  isEqual(other: unknown) {
    return (
      other instanceof FakeTimestamp &&
      other.seconds === this.seconds &&
      other.nanoseconds === this.nanoseconds
    );
  }
}

export class FakeTransaction {
  async get(ref: FakeDocRef) {
    return ref.get();
  }
  set(
    ref: FakeDocRef,
    data: Record<string, unknown>,
    options?: { merge?: boolean },
  ) {
    return ref.set(data, options);
  }
  update(ref: FakeDocRef, data: Record<string, unknown>) {
    return ref.update(data);
  }
}

// Alias Transaction to FakeTransaction for test compatibility
export type Transaction = FakeTransaction;
