/**
 * Complete Measurement UI
 *
 * Orchestrates device pairing, sessions, and floor plan drawing
 */

"use client";

import type { MeasureGeometry, MeasureReading } from "@/types/measureSchema";
import { useState } from "react";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { LeicaDevicePairing } from "./LeicaDevicePairing";
import { MeasurementSession } from "./MeasurementSession";
import { PDFExport } from "./PDFExport";

interface MeasurementUIProps {
  workspaceId: string;
  jobId: string;
  roomId: string;
  userId: string;
}

type Step = "device" | "session" | "canvas";

export function MeasurementUI({
  workspaceId,
  jobId,
  roomId,
  userId,
}: MeasurementUIProps) {
  const [currentStep, setCurrentStep] = useState<Step>("device");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [readings, setReadings] = useState<(MeasureReading & { id: string })[]>(
    [],
  );
  const [geometry, setGeometry] = useState<
    (MeasureGeometry & { id: string }) | null
  >(null);

  function handleDevicePaired() {
    setCurrentStep("session");
  }

  function handleSessionCreated(sessionId: string) {
    setActiveSessionId(sessionId);
    setCurrentStep("canvas");
  }

  function handleReadingCaptured(reading: MeasureReading & { id: string }) {
    setReadings((prev) => [...prev, reading]);
  }

  function handleGeometryUpdated(geo: MeasureGeometry & { id: string }) {
    setGeometry(geo);
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Square Measure™</h1>
        <p className="text-muted">Professional laser measurement system</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  currentStep === "device"
                    ? "bg-blue-600 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                1
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Device Pairing</p>
                <p className="text-xs text-gray-500">Connect Leica Disto</p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 w-16 h-1 bg-gray-300">
            <div
              className={`h-full transition-all ${
                currentStep !== "device" ? "bg-green-500" : "bg-gray-300"
              }`}
              style={{ width: currentStep !== "device" ? "100%" : "0%" }}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  currentStep === "session"
                    ? "bg-blue-600 text-white"
                    : currentStep === "canvas"
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-muted"
                }`}
              >
                2
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Start Session</p>
                <p className="text-xs text-gray-500">Choose mode</p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 w-16 h-1 bg-gray-300">
            <div
              className={`h-full transition-all ${
                currentStep === "canvas" ? "bg-green-500" : "bg-gray-300"
              }`}
              style={{ width: currentStep === "canvas" ? "100%" : "0%" }}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  currentStep === "canvas"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-muted"
                }`}
              >
                3
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Measure & Draw</p>
                <p className="text-xs text-gray-500">Create floor plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white text-slate-900 border border-gray-200 rounded-lg shadow-sm">
        {currentStep === "device" && (
          <div className="p-6">
            <LeicaDevicePairing
              workspaceId={workspaceId}
              userId={userId}
              onDevicePaired={handleDevicePaired}
            />
          </div>
        )}

        {currentStep === "session" && (
          <div className="p-6">
            <MeasurementSession
              workspaceId={workspaceId}
              jobId={jobId}
              roomId={roomId}
              userId={userId}
              onSessionCreated={handleSessionCreated}
              onReadingCaptured={handleReadingCaptured}
            />
          </div>
        )}

        {currentStep === "canvas" && activeSessionId && (
          <div className="p-6">
            <FloorPlanCanvas
              workspaceId={workspaceId}
              jobId={jobId}
              roomId={roomId}
              sessionId={activeSessionId}
              readings={readings}
              userId={userId}
              onGeometryUpdated={handleGeometryUpdated}
            />
          </div>
        )}
      </div>

      {/* Summary Panel */}
      {geometry && (
        <div className="mt-6 bg-gradient-to-r from-accent-success to-accent-info border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            Measurement Complete ✓
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted">Area</p>
              <p className="text-2xl font-bold text-green-900">
                {(geometry.calculations.area / 144).toFixed(1)} sq ft
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">Perimeter</p>
              <p className="text-2xl font-bold text-green-900">
                {(geometry.calculations.perimeter / 12).toFixed(1)} ft
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">Baseboard</p>
              <p className="text-2xl font-bold text-green-900">
                {(geometry.calculations.baseboardLf || 0).toFixed(1)} LF
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">Confidence</p>
              <p className="text-2xl font-bold text-green-900">
                {geometry.confidence.score}%
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
              Create Estimate
            </button>
            <div className="flex-1">
              <PDFExport
                workspaceId={workspaceId}
                jobId={jobId}
                roomId={roomId}
                geometry={geometry}
                userId={userId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
