"use client";
import dynamic from "next/dynamic";
const FounderSystemHealthPage = dynamic(
  () => import("../FounderSystemHealthPage"),
  { ssr: false },
);

export default function SystemHealthPage() {
  return <FounderSystemHealthPage />;
}
