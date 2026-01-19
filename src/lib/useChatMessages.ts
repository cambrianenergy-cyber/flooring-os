import { useEffect, useRef, useState } from "react";
import { debugOnSnapshot } from "./debugOnSnapshot";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { auth } from "../lib/firebase";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export default function useChatMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = debugOnSnapshot(q, "CHAT_MESSAGES_LISTENER", (snapshot: any) => {
      setMessages(
        snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Message))
      );
      setLoading(false);
    });
    return () => unsub();
  }, [conversationId]);

  // sender: optional, defaults to current user
  const sendMessage = async (text: string, sender?: string) => {
    let senderId = sender;
    if (!senderId) {
      const user = auth.currentUser;
      if (!user) return;
      senderId = user.email || user.uid;
    }
    await addDoc(collection(db, "conversations", conversationId, "messages"), {
      sender: senderId,
      text,
      timestamp: Date.now(),
      createdAt: serverTimestamp(),
    });
  };

  return { messages, loading, sendMessage };
}
