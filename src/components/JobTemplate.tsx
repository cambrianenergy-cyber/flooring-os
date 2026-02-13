"use client";

interface JobTemplateProps {
  jobName: string;
  address: string;
  startDate: string;
  rep: string;
  status: string;
  notes?: string;
}

export default function JobTemplate({
  jobName,
  address,
  startDate,
  rep,
  status,
  notes,
}: JobTemplateProps) {
  return (
    <div className="max-w-lg mx-auto p-4 border rounded bg-background text-slate-900">
      <h2 className="text-xl font-bold mb-2">Job Summary</h2>
      <div className="mb-2">
        Job: <span className="font-semibold">{jobName}</span>
      </div>
      <div className="mb-2">
        Address: <span className="font-semibold">{address}</span>
      </div>
      <div className="mb-2">
        Start Date: <span className="font-semibold">{startDate}</span>
      </div>
      <div className="mb-2">
        Assigned Rep: <span className="font-semibold">{rep}</span>
      </div>
      <div className="mb-2">
        Status: <span className="font-semibold">{status}</span>
      </div>
      {notes && (
        <div className="mb-2">
          Notes: <span className="font-semibold">{notes}</span>
        </div>
      )}
      <div className="mt-4 text-xs text-gray-500">
        For questions, contact your Square Flooring Pro Suite rep.
      </div>
    </div>
  );
}
