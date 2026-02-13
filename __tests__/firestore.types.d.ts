// --- Firestore Types ---

export interface FirestoreLike {
  collection(name: string): CollectionReferenceLike;
  doc(collectionPath: string, docId?: string): DocumentReferenceLike;
  runTransaction<T>(fn: (txn: TransactionLike) => Promise<T>): Promise<T>;
  // ...other Firestore root methods
}

export interface CollectionReferenceLike {
  doc(id?: string): DocumentReferenceLike;
  where(fieldOrFilter: unknown, opStr?: unknown, value?: unknown): QueryLike;
  limit(n: number): QueryLike;
  // ...other CollectionReference methods
}

export interface DocumentReferenceLike {
  collection(collectionPath: string): CollectionReferenceLike;
  set(
    data: Record<string, unknown>,
    options?: { merge?: boolean },
  ): Promise<void>;
  get(): Promise<{
    exists: boolean;
    data: () => unknown;
    ref: DocumentReferenceLike;
  }>;
  update(patch: Record<string, unknown>): Promise<void>;
  // ...other DocumentReference methods
}

export interface QueryLike {
  get(): Promise<{
    docs: Array<{
      id: string;
      data: () => Record<string, unknown>;
      ref: DocumentReferenceLike;
      exists: boolean;
    }>;
  }>;
  where(fieldOrFilter: unknown, opStr?: unknown, value?: unknown): QueryLike;
  limit(n: number): QueryLike;
  // ...other Query methods
}

export interface TransactionLike {
  get(ref: DocumentReferenceLike): Promise<{
    exists: boolean;
    data: () => unknown;
    ref: DocumentReferenceLike;
  }>;
  set(
    ref: DocumentReferenceLike,
    data: Record<string, unknown>,
    options?: { merge?: boolean },
  ): Promise<void>;
  update(
    ref: DocumentReferenceLike,
    data: Record<string, unknown>,
  ): Promise<void>;
  // ...other Transaction methods
}
