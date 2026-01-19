
import { useState } from "react";
import InfoTooltip from "@/components/InfoTooltip";
import ConfettiBurst from "../../components/ConfettiBurst";
import { useRouter } from "next/navigation";

export default function FirstJobCreation() {

  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [flooringType, setFlooringType] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [estimate, setEstimate] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Simulate instant estimate, suggestions, and timeline
    setEstimate(`$${(Number(squareFootage) * 7.5).toFixed(2)} (template)`);
    setSuggestions(
      `Labor: 2 installers, Material: ${flooringType || "Laminate"} (auto-suggested)`
    );
    setTimeline("Start: Tomorrow, Finish: 3 days");
    // Redirect to Instant Win after short delay
    setTimeout(() => router.push("/onboarding/InstantWin"), 1800);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground">
        <h1 className="text-xl font-semibold mb-4 text-foreground flex items-center">Let’s create your next job.
          <InfoTooltip text="Start by entering basic job details. You’ll get an instant estimate and suggestions." />
        </h1>
        <label className="block mt-2 text-sm flex items-center">Customer name
          <InfoTooltip text="Enter the customer’s full name. This helps with job tracking and communication." />
        </label>
        <input className="w-full border rounded-md p-2 mt-1" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
        <label className="block mt-3 text-sm flex items-center">Address
          <InfoTooltip text="Enter the job site address. You can use autocomplete if enabled." />
        </label>
        <input className="w-full border rounded-md p-2 mt-1" value={address} onChange={e => setAddress(e.target.value)} required />
        <label className="block mt-3 text-sm flex items-center">Flooring type
          <InfoTooltip text="Choose the flooring type. Suggestions: Laminate, Hardwood, Tile, Carpet." />
        </label>
        <div className="flex gap-2 mt-1 mb-2">
          {["Laminate", "Hardwood", "Tile", "Carpet"].map(type => (
            <button
              key={type}
              type="button"
              className={`px-2 py-1 rounded border ${flooringType === type ? "bg-accent text-background" : "bg-background text-foreground"}`}
              onClick={() => setFlooringType(type)}
              aria-label={`Quick select ${type}`}
            >
              {type}
            </button>
          ))}
        </div>
        <input className="w-full border rounded-md p-2 mt-1" value={flooringType} onChange={e => setFlooringType(e.target.value)} placeholder="e.g. Laminate, Hardwood" required />
        <label className="block mt-3 text-sm flex items-center">Rough square footage
          <InfoTooltip text="Estimate the total square footage for the job. This helps calculate pricing." />
        </label>
        <input className="w-full border rounded-md p-2 mt-1" value={squareFootage} onChange={e => setSquareFootage(e.target.value)} type="number" min="1" required />
        <button className="w-full mt-5 bg-accent text-background rounded-md p-2 font-medium" type="submit" aria-label="Create job">Create job</button>
        <button
          type="button"
          className="w-full mt-2 border border-muted text-muted bg-background rounded-md p-2 font-medium"
          onClick={() => alert('Draft saved! You can return and finish later.')}
          aria-label="Save job draft"
        >
          Save draft
        </button>
        {estimate && (
          <>
            <ConfettiBurst trigger={!!estimate} />
            <div className="mt-6 p-4 bg-dark-surface rounded shadow" aria-live="polite">
            <div className="font-semibold text-lg mb-2">Estimate: {estimate}</div>
            <div className="mb-1">{suggestions}</div>
            <div className="mb-1">Timeline: {timeline}</div>
            <div className="mt-2 text-green-500 font-bold text-center text-xl">🎉 First dopamine hit</div>
            <div className="text-muted text-center mt-1">“Oh… this already saved me time.” <InfoTooltip text="Instant estimate and suggestions are powered by AI. You can edit or ignore them." /></div>
            <button
              type="button"
              className="w-full mt-4 bg-accent text-background rounded-md p-2 font-medium"
              onClick={() => router.push("/onboarding/InstantWin")}
            >
              Next step: Get your instant win
            </button>
            </div>
          </>
        )}
      <div className="text-xs text-muted mt-3 text-center flex flex-col items-center">
        <span>Your privacy is protected. <InfoTooltip text="We never share your job data with third parties. All information is encrypted and handled securely." /></span>
      </div>
    </form>
    </main>
  );
}
