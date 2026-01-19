/**
 * Measurement Page
 * 
 * Full-page measurement interface with FreeDrawBoard
 */

"use client";

import FreeDrawBoard from "@/components/FreeDrawBoard";
import AuthGuard from "@/components/AuthGuard";

export default function MeasurementPage() {
  return (
    <AuthGuard>
      <FreeDrawBoard />
    </AuthGuard>
  );
}
