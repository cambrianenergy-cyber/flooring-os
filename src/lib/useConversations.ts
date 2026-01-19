import { useEffect, useState } from "react";
import { collection, query, where, orderBy } from "firebase/firestore";
import { safeOnSnapshot } from "../../scripts/safeOnSnapshot";
import { db } from "../lib/firebase";
import { auth } from "../lib/firebase";
import { useWorkspaceMembership } from "./useWorkspaceMembership";

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt?: number;
}

import type { QuerySnapshot, DocumentData } from "firebase/firestore";

export function useConversations(workspaceId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { membership, loading: membershipLoading } = useWorkspaceMembership(workspaceId || "");

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const user = auth.currentUser;
    // Only attach listener if all gating conditions are met
    if (user && workspaceId && !membershipLoading && membership && membership.status === "active") {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.email || user.uid),
        orderBy("updatedAt", "desc")
      );
      unsub = safeOnSnapshot(q, "CONVERSATIONS_LISTENER", (snapshot: QuerySnapshot<DocumentData>) => {
        setConversations(
          snapshot.docs.map((doc: DocumentData) => ({ id: doc.id, ...doc.data() } as Conversation))
        );
        setLoading(false);
      });
      // Loading state will be set by listener callback
    } else {
      // If not eligible, clear state but do not call setState synchronously in effect body
      setTimeout(() => {
        setConversations([]);
        setLoading(!!user && !!workspaceId && !membershipLoading);
      }, 0);
    }
    return () => {
      if (unsub) unsub();
    };
  }, [workspaceId, membership, membershipLoading]);

  return { conversations, loading };
}
