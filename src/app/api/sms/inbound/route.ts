import { NextRequest, NextResponse } from "next/server";

// This endpoint receives inbound SMS from Twilio
export async function POST(req: Request) {
  // Twilio sends data as application/x-www-form-urlencoded
  const bodyText = await req.text();
  const params = new URLSearchParams(bodyText);
  const from = params.get("From");
  const to = params.get("To");
  const body = params.get("Body");

  // Log or process the inbound SMS
  console.log("Inbound SMS from Twilio:", { from, to, body });

  // Respond with empty TwiML to acknowledge receipt
  return new Response("<Response></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
