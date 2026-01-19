import { auth } from "@/lib/firebaseClient";

export async function authHeaders() {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Not signed in.");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}
