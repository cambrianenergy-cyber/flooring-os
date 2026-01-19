// Simple confetti component using canvas-confetti (install with: npm install canvas-confetti)
import { useEffect } from "react";

export default function ConfettiBurst({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (!trigger) return;
    import("canvas-confetti").then(confetti => {
      confetti.default({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    });
  }, [trigger]);
  return null;
}
