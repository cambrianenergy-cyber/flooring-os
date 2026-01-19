
"use client";
import Messaging2 from "../../../components/Messaging2";
import { useRouter } from "next/navigation";

export default function MessagesPage() {
  const router = useRouter();
  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 text-blue-600 underline">Back</button>
      <h1 className="text-2xl font-semibold mb-4">Messages</h1>
      <Messaging2 />
    </div>
  );
}
