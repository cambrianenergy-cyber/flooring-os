import React, { useState } from "react";

export default function ReviewAutomation({ jobId }: { jobId: string }) {
  const [requested, setRequested] = useState(false);

  const requestReview = () => {
    setRequested(true);
    // TODO: Trigger review request (email/SMS)
  };

  return (
    <div className="border rounded p-4 mb-4">
      <h2 className="text-lg font-semibold mb-2">Review Request Automation</h2>
      <button
        onClick={requestReview}
        className="px-4 py-2 bg-blue-600 text-white rounded"
        disabled={requested}
      >
        {requested ? "Review Requested" : "Request Review"}
      </button>
    </div>
  );
}
