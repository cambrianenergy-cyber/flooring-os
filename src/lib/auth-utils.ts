// Founder emails with unlimited access

// All founder emails must be lowercase for strict enforcement
const FOUNDER_EMAILS = [
  "financialgrowthdfw@gmail.com",
  "cambrianenergy@gmail.com"
];


// Enforce founder rules: only these emails have founder privileges
export function isFounder(email: string | null | undefined): boolean {
  if (!email) return false;
  return FOUNDER_EMAILS.includes(email.toLowerCase());
}

export function getAccessLevel(email: string | null | undefined) {
  if (isFounder(email)) {
    return { level: "founder", unlimited: true };
  }
  return { level: "user", unlimited: false };
}
