"use client";
import WorkflowStepper from "../../../components/WorkflowStepper";
import { EmptyStateReviews } from "@/app/components/EmptyStates";
export default function ReviewPage() {
  // TODO: Replace with real review list logic
  const reviews: any[] = [];
  const loading = false;
  return (
    <div>
      <WorkflowStepper current="Review" />
      <h1 className="text-2xl font-semibold mb-6">Review</h1>
      {loading ? (
        <div className="text-muted">Loading reviews5</div>
      ) : reviews.length === 0 ? (
        <EmptyStateReviews />
      ) : (
        <div>/* Render reviews list here */</div>
      )}
    </div>
  );
}