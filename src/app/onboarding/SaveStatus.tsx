import React from "react";

interface SaveStatusProps {
  status: "saved" | "saving" | "error";
  errorMessage?: string;
}

export default function SaveStatus({ status, errorMessage }: SaveStatusProps) {
  if (status === "saving") {
    return <div className="text-xs text-muted">Saving…</div>;
  }
  if (status === "saved") {
    return <div className="text-xs text-green-600">Saved</div>;
  }
  if (status === "error") {
    return <div className="text-xs text-red-500">{errorMessage || "Error saving"}</div>;
  }
  return null;
}
