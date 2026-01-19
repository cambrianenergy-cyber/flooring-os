"use client";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/InfoTooltip";
import { useRouter } from "next/navigation";

const STAGES = ["Scheduled", "In Progress", "Complete"];
const CREW = ["Unassigned", "Crew A", "Crew B", "Crew C"];

export default function JobTrackingDay1() {
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [crew, setCrew] = useState(CREW[0]);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [showPrompt, setShowPrompt] = useState(true);
  const [progressSaved, setProgressSaved] = useState(false);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
      setProgressSaved(true);
    }
  }

  // Simulate progress save and auto-advance after a short delay
  useEffect(() => {
    if (progressSaved) {
      const timeout = setTimeout(() => {
        router.push("/onboarding/expansion-moment");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [progressSaved, router]);

  if (showPrompt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground text-center">
          <h1 className="text-xl font-semibold mb-4">Want to track this job as it progresses?</h1>
          <button className="mt-4 bg-accent text-background rounded-md p-2 px-6 font-medium" onClick={() => setShowPrompt(false)}>
            Yes, track this job
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground">
        <h1 className="text-xl font-semibold mb-4 flex items-center">Job Progress Tracker
          <InfoTooltip text="Track job progress, crew assignment, notes, and photos. All updates are saved automatically." />
        </h1>
        <div className="mb-4">
          <label className="block text-sm mb-1 flex items-center">Job Stage
            <InfoTooltip text="Select the current stage of the job. This helps with tracking and notifications." />
          </label>
          <select className="w-full border rounded-md p-2" value={stage} onChange={e => setStage(Number(e.target.value))} aria-label="Job stage selection">
            {STAGES.map((s, i) => (
              <option key={s} value={i}>{s}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1 flex items-center">Crew Assignment
            <InfoTooltip text="Assign a crew to this job. Suggestions: Crew A, Crew B, Crew C. You can add more crews in settings." />
          </label>
          <div className="flex gap-2 mb-2">
            {CREW.slice(1).map(c => (
              <button
                key={c}
                type="button"
                className={`px-2 py-1 rounded border ${crew === c ? "bg-accent text-background" : "bg-background text-foreground"}`}
                onClick={() => setCrew(c)}
                aria-label={`Quick select ${c}`}
              >
                {c}
              </button>
            ))}
          </div>
          <select className="w-full border rounded-md p-2" value={crew} onChange={e => setCrew(e.target.value)} aria-label="Crew assignment selection">
            {CREW.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1 flex items-center">Notes
            <InfoTooltip text="Add notes about this job. Only you and your team can see these notes." />
          </label>
          <textarea className="w-full border rounded-md p-2" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add notes about this job..." aria-label="Job notes" />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1 flex items-center">Photos
            <InfoTooltip text="Upload job site photos. These help with documentation and team communication." />
          </label>
          <input type="file" multiple accept="image/*" onChange={handlePhotoChange} aria-label="Upload job photos" />
          {photos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {photos.map((file, idx) => (
                <span key={idx} className="text-xs bg-dark-surface rounded px-2 py-1">{file.name}</span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 text-center text-green-500 font-bold" aria-live="polite">Progress saved!</div>
        {progressSaved && (
          <>
            <div className="text-xs text-muted text-center mt-2">Taking you to the next step…</div>
            <button
              className="w-full mt-4 bg-accent text-background rounded-md p-2 font-medium"
              onClick={() => router.push('/onboarding/expansion-moment')}
              aria-label="Next step: Continue"
            >
              Next step: Continue
            </button>
            <button
              className="w-full mt-2 border border-muted text-muted bg-background rounded-md p-2 font-medium"
              onClick={() => alert('Progress saved! You can return and update later.')}
              aria-label="Save job progress"
            >
              Save progress
            </button>
          </>
        )}
      <div className="text-xs text-muted mt-3 text-center flex flex-col items-center">
        <span>Your privacy is protected. <InfoTooltip text="We never share your job tracking data with third parties. All information is encrypted and handled securely." /></span>
      </div>
    </div>
    </main>
  );
}
