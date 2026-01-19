
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Step7Page() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // TODO: Replace with actual workspaceId and userId from auth/session
  const workspaceId = "demo-workspace";
  const userId = "demo-user";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!input.trim()) {
      setError("This field is required.");
      return;
    }
    setLoading(true);
    try {
      await setDoc(
        doc(db, `workspaces/${workspaceId}/onboardingSteps/step-7`),
        { input, completedAt: Date.now(), userId }
      );
      await setDoc(
        doc(db, `workspaces/${workspaceId}/onboarding/state`),
        { currentStep: "complete", updatedAt: Date.now() },
        { merge: true }
      );
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Step 7: Final Step</h1>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-medium">Any final notes or comments?</label>
        <input
          className="border rounded px-3 py-2 w-full mb-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : "Finish"}
        </button>
      </form>
    </div>
  );
}
