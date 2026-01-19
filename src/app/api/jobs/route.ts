import { NextResponse } from "next/server";
import { createJob, updateJob } from "@/lib/jobs";

// POST /api/jobs - create a new job
export async function POST(req: Request) {
  const body = await req.json();
  const { workspaceId, customerId, name, notes, scheduledDate } = body;
  if (!workspaceId || !customerId || !name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const jobId = await createJob(workspaceId, { customerId, name, notes, scheduledDate });
  return NextResponse.json({ jobId });
}

// PATCH /api/jobs/:jobId - update a job
export async function PATCH(req: Request) {
  const { jobId, ...data } = await req.json();
  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  await updateJob(jobId, data);
  return NextResponse.json({ success: true });
}
