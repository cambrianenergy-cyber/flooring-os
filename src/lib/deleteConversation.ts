import { doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function deleteConversation(conversationId: string) {
  await deleteDoc(doc(db, "conversations", conversationId));
}
