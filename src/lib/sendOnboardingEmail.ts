import nodemailer from "nodemailer";

export async function sendOnboardingEmail({
  to = "cambrianenergy@gmail.com",
  subject = "New Onboarding Event",
  text = "A user has onboarded or updated onboarding data.",
  html,
}: {
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
}) {
  // Configure your SMTP transport (use environment variables in production)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NOTIFY_EMAIL_USER,
      pass: process.env.NOTIFY_EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.NOTIFY_EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
}
