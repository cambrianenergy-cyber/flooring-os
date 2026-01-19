// Schema for onboarding step 5 server-side validation (if needed)
export interface Step5ServerData {
  // Define server-side fields if different from client
  pricePerUnit: number;
  currency: string;
}