"use client";
import dynamic from "next/dynamic";
const FounderContractsQueuePage = dynamic(
  () => import("../FounderContractsQueuePage"),
  { ssr: false },
);

export default function ContractsQueuePage() {
  return <FounderContractsQueuePage />;
}
