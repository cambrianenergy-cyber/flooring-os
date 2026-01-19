import { NextApiRequest, NextApiResponse } from "next";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { to, body } = req.body;
    if (!to || !body) return res.status(400).json({ error: "Missing to or body" });
    try {
      const message = await client.messages.create({
        body,
        from: fromNumber,
        to,
      });
      res.status(200).json({ sid: message.sid });
    } catch (err) {
      res.status(500).json({ error: "Failed to send SMS" });
    }
  } else {
    res.status(405).end();
  }
}
