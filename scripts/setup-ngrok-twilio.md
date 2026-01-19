import { hasFeature, resolvePlan, type PlanKey } from "@/lib/plans";# Local ngrok + Twilio Webhook Setup

This script automates the process of exposing your local dev server to Twilio using ngrok and updates your Twilio phone number's webhook to point to your local /api/sms/inbound endpoint.

## Prerequisites
- [ngrok](https://ngrok.com/download) installed and available in your PATH
- Twilio CLI installed and authenticated, or set the following environment variables:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

## Usage

1. Open PowerShell in your project root.
2. Run the script:

    ```powershell
    ./scripts/setup-ngrok-twilio.ps1 -Port 3000
    ```
    - You can specify a different port if your Next.js dev server runs elsewhere.
    - You can also set Twilio credentials as parameters or environment variables.

3. The script will:
    - Start ngrok on the specified port
    - Retrieve the public ngrok URL
    - Update your Twilio phone number's SMS webhook to point to `https://<ngrok-url>/api/sms/inbound`

## Troubleshooting
- Ensure ngrok is installed and in your PATH.
- Ensure your Twilio credentials and phone number are correct.
- If you see errors, check that ngrok is running and that your Twilio credentials are valid.

---

**This script is for local development only.**

For production, set your Twilio webhook to your deployed API endpoint.
