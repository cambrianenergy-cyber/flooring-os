import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OnboardingProgress from "./OnboardingProgress";

export default function Welcome() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");
  const [showAccessibility, setShowAccessibility] = useState(false);

  // Simulate fetching user name (replace with real auth logic)
  useEffect(() => {
    // In real app, fetch user name asynchronously
    const timer = setTimeout(() => setUserName("Contractor"), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg border rounded-lg p-6 bg-dark-panel shadow text-foreground">
        {/* Animated Introduction or Video Placeholder */}
        <div className="mb-6 flex justify-center">
          <div className="w-full max-w-md aspect-video bg-muted flex items-center justify-center rounded-lg border">
            <span className="text-muted-foreground text-lg">
              [Animated intro or video goes here]
            </span>
          </div>
        </div>
        <OnboardingProgress currentStep={1} />
        <h1 className="text-2xl font-bold mb-2 text-accent">
          Welcome{userName ? `, ${userName}` : ""}!
        </h1>
        <p className="mb-4 text-foreground">
          Let&apos;s get your workspace set up. Completing onboarding unlocks
          all features and ensures a smooth experience.
        </p>
        <ul className="mb-4 list-disc pl-6 text-sm text-muted-foreground">
          <li>Access all contractor tools</li>
          <li>Faster setup and quoting</li>
          <li>Personalized workspace</li>
        </ul>
        <div className="mb-4">
          <label className="block text-sm mb-1">Language:</label>
          <select
            className="border rounded p-2 w-full"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            {/* Add more languages as needed */}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Accessibility Options:</label>
          <button
            className="underline text-accent text-sm"
            onClick={() => setShowAccessibility(!showAccessibility)}
            type="button"
          >
            {showAccessibility ? "Hide" : "Show"} Accessibility Settings
          </button>
          {showAccessibility && (
            <div className="mt-2 text-xs">
              <label>
                <input type="checkbox" /> High Contrast Mode
              </label>
              <br />
              <label>
                <input type="checkbox" /> Larger Text
              </label>
            </div>
          )}
        </div>
        <div className="mb-4">
          <button
            className="underline text-accent text-sm mr-4"
            type="button"
            onClick={() => router.push("/onboarding/steps-preview")}
          >
            Preview All Steps
          </button>
          <button
            className="underline text-muted text-sm"
            type="button"
            onClick={() => router.push("/dashboard")}
          >
            Skip Onboarding
          </button>
        </div>
        <div className="mb-4 text-xs text-muted-foreground">
          <strong>Privacy Notice:</strong> Your data is securely stored and used
          only to personalize your experience.{" "}
          <a href="/privacy" className="underline text-accent">
            Learn more
          </a>
          .
        </div>
        <button
          className="w-full bg-accent text-background rounded-md p-3 font-bold mt-2"
          onClick={() => router.push("/onboarding/step/2")}
        >
          Start Onboarding
        </button>
        {/* Optional: Add animation or video here */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Need help?{" "}
          <a href="/help" className="underline text-accent">
            Contact support
          </a>
        </div>
      </div>
    </main>
  );
}
