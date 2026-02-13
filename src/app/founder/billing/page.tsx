"use client";
import dynamic from "next/dynamic";
const FounderBillingPage = dynamic(() => import("../FounderBillingPage"), {
  ssr: false,
});

export default function BillingPage() {
  return <FounderBillingPage />;
}
