import React from "react";
import Link from "next/link";

export function EmptyStateEstimates() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="text-2xl font-bold mb-2 text-indigo-600">No Estimates Yet</div>
      <div className="mb-4 text-[#7985a8]">Estimates are the first step in your workflow. Create an estimate to get started on a new job.</div>
      <Link href="/estimates/new" className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold hover:bg-indigo-700 transition">Create Estimate</Link>
    </div>
  );
}

export function EmptyStateJobs() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="text-2xl font-bold mb-2 text-indigo-600">No Jobs Yet</div>
      <div className="mb-4 text-[#7985a8]">Jobs are created from approved estimates. Convert an estimate to a job to track progress and tasks.</div>
      <Link href="/estimates" className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold hover:bg-indigo-700 transition">View Estimates</Link>
    </div>
  );
}

export function EmptyStateInvoices() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="text-2xl font-bold mb-2 text-indigo-600">No Invoices Yet</div>
      <div className="mb-4 text-[#7985a8]">Invoices are sent to clients after work is completed. Create an invoice to get paid for your work.</div>
      <Link href="/invoices/new" className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold hover:bg-indigo-700 transition">Create Invoice</Link>
    </div>
  );
}

export function EmptyStateReviews() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="text-2xl font-bold mb-2 text-indigo-600">No Reviews Yet</div>
      <div className="mb-4 text-[#7985a8]">Reviews help you close the loop and improve your process. Request a review after completing a job.</div>
      <Link href="/jobs" className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold hover:bg-indigo-700 transition">View Jobs</Link>
    </div>
  );
}
