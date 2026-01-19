/**
 * Initialization Guide - Device Abstraction & Laser Integration
 * 
 * How to set up the laser device system in your app
 */

// ============================================================================
// Step 1: Initialize Laser Devices at App Boot
// ============================================================================

// src/app/layout.tsx or src/app/providers.tsx
import { FeaturesProvider } from "@/lib/deviceDetectionProvider";
import { createLeicaDistoDevice } from "@/lib/LeicaDistoDevice";
import { laserDeviceManager } from "@/lib/LaserDeviceAbstraction";

export function Providers({ children }: { children: React.ReactNode }) {
  // Register supported laser devices
  laserDeviceManager.registerDevice("leica-d810", createLeicaDistoDevice("D810"));
  laserDeviceManager.registerDevice("leica-d3", createLeicaDistoDevice("D3"));

  // TODO: Register Bosch GLM when implementation is ready
  // laserDeviceManager.registerDevice("bosch-glm120", createBoschGLMDevice("GLM120"));

  return (
    <FeaturesProvider>
      {children}
    </FeaturesProvider>
  );
}

// ============================================================================
// Step 2: Use in React Components
// ============================================================================

// Example 1: Button to discover and connect
import { useLaserConnection, useLaserDeviceStatus } from "@/lib/useLaserDevice";

export function ConnectLaserButton() {
  const { discover, connect, connecting, error } = useLaserConnection();
  const status = useLaserDeviceStatus();

  const handleClick = async () => {
    try {
      const devices = await discover();
      if (devices.length === 0) {
        alert("No laser devices found. Is Bluetooth on?");
        return;
      }

      // For now, connect to first device
      // TODO: Show device selection UI
      await connect(devices[0]);
    } catch (err) {
      console.error("Connection error:", err);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={connecting || status === "connected"}
        className={
          status === "connected"
            ? "bg-green-500"
            : "bg-blue-500"
        }
      >
        {connecting && "Connecting..."}
        {status === "connected" && "✓ Laser Connected"}
        {status === "disconnected" && "Find Laser"}
        {status === "error" && "⚠ Connection Failed"}
      </button>

      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}

// Example 2: Single measurement (shoot once)
import { useLaserMeasurement } from "@/lib/useLaserDevice";

export function MeasureButton() {
  const { measure, measurement, isLoading, error } = useLaserMeasurement();

  return (
    <div>
      <button onClick={measure} disabled={isLoading}>
        {isLoading ? "Measuring..." : "Measure Distance"}
      </button>

      {measurement && (
        <p>
          Distance: {measurement.distance.toFixed(2)}m
          {measurement.bearing !== undefined && (
            <> (Bearing: {measurement.bearing.toFixed(1)}°)</>
          )}
        </p>
      )}

      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}

// Example 3: Walk-the-room (continuous measurement for geometry capture)
import { useLaserContinuous } from "@/lib/useLaserDevice";
import { GeometryEngine } from "@/lib/GeometryEngine";
import type { GeometryData } from "@/lib/geometrySchema";

export function WalkTheRoomCapture({
  onGeometryComplete,
}: {
  onGeometryComplete: (geometry: GeometryData) => void;
}) {
  const { isActive, measurements, start, stop } = useLaserContinuous();
  const geometryEngine = React.useRef(new GeometryEngine({
    id: "",
    roomId: "new",
    jobId: "",
    workspaceId: "",
    points: [],
    segments: [],
    labels: [],
    layers: [],
    constraints: [],
    mode: "points",
    closedPolygon: false,
    perimeter: 0,
    area: 0,
    version: 0,
    updatedAt: Date.now(),
    updatedBy: "user",
  }));

  const handleStart = async () => {
    geometryEngine.current = new GeometryEngine({
      id: "",
      roomId: "new",
      jobId: "",
      workspaceId: "",
      points: [],
      segments: [],
      labels: [],
      layers: [],
      constraints: [],
      mode: "points",
      closedPolygon: false,
      perimeter: 0,
      area: 0,
      version: 0,
      updatedAt: Date.now(),
      updatedBy: "user",
    });

    await start();
  };

  const handleStop = async () => {
    await stop();

    // Convert measurements to geometry
    let lastPoint: any = null;
    for (const measurement of measurements) {
      const point = geometryEngine.current.addPoint(
        measurement.distance,
        measurement.bearing ?? 0
      );

      if (lastPoint) {
        geometryEngine.current.addSegment(lastPoint.id, point.id, "wall");
      }
      lastPoint = point;
    }

    // Close polygon
    if (measurements.length >= 3) {
      geometryEngine.current.closePolygon();
    }

    // Emit finished geometry
    const finalGeometry = geometryEngine.current.geometry;
    const computed = geometryEngine.current.exportComputed();
    
    onGeometryComplete({
      ...finalGeometry,
      perimeter: computed.perimeter,
      area: computed.area,
      closedPolygon: computed.isClosed,
    });
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3>Walk-The-Room Measurement</h3>

      <button
        onClick={isActive ? handleStop : handleStart}
        className={isActive ? "bg-red-500" : "bg-green-500"}
      >
        {isActive ? "Stop Walk" : "Start Walk"}
      </button>

      <div className="mt-4">
        <p>Measurements: {measurements.length}</p>
        {measurements.length > 0 && (
          <p className="text-sm">
            Last: {measurements[measurements.length - 1].distance.toFixed(2)}m
          </p>
        )}
      </div>

      {measurements.length >= 3 && isActive === false && (
        <div className="mt-4 p-3 bg-green-50 rounded">
          <p className="font-semibold">✓ Geometry Captured</p>
          <p className="text-sm">Points: {measurements.length}</p>
        </div>
      )}
    </div>
  );
}

// Example 4: Battery monitoring
import { useLaserBattery } from "@/lib/useLaserDevice";

export function LaserBatteryIndicator() {
  const battery = useLaserBattery(5000); // Poll every 5 seconds

  if (battery === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span>Laser Battery:</span>
      <div className="w-16 h-4 border rounded bg-gray-200">
        <div
          className={
            battery > 50
              ? "bg-green-500"
              : battery > 20
                ? "bg-yellow-500"
                : "bg-red-500"
          }
          style={{ width: `${battery}%`, height: "100%" }}
        />
      </div>
      <span className="text-sm">{battery}%</span>
    </div>
  );
}

// ============================================================================
// Step 3: Feature Gating (Device-Specific Features)
// ============================================================================

import { FeatureGate } from "@/components/FeatureGate";
import { useCanFeature } from "@/lib/deviceDetectionProvider";

// Only show on iPad (Roll-Cut Optimizer is iPad-exclusive)
export function RollCutOptimizer() {
  return (
    <FeatureGate name="rollCutOptimizer">
      <div>
        <h3>Roll-Cut Optimizer</h3>
        <p>Optimizing seam layout...</p>
      </div>
    </FeatureGate>
  );
}

// Conditional rendering using hook
export function AdvancedEditTools() {
  const canEditGeometry = useCanFeature("editGeometry");

  if (!canEditGeometry) {
    return <p>This device doesn't support geometry editing</p>;
  }

  return (
    <div>
      <button>Edit with Apple Pencil</button>
      <button>Freehand Draw</button>
    </div>
  );
}

// ============================================================================
// Step 4: Firestore Sync (Cross-Device)
// ============================================================================

// Save geometry after walk-the-room capture
import { setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function saveGeometryToFirestore(
  jobId: string,
  roomId: string,
  geometry: GeometryData
) {
  try {
    await setDoc(
      doc(db, "jobs", jobId, "rooms", roomId, "geometry", "current"),
      {
        ...geometry,
        updatedAt: Date.now(),
        updatedBy: "field-worker", // TODO: use auth.currentUser.uid
      },
      { merge: true }
    );

    console.log("Geometry saved to Firestore");
  } catch (error) {
    console.error("Error saving geometry:", error);
  }
}

// Load geometry on iPad
import { getDoc } from "firebase/firestore";

async function loadGeometryFromFirestore(jobId: string, roomId: string) {
  try {
    const docSnap = await getDoc(
      doc(db, "jobs", jobId, "rooms", roomId, "geometry", "current")
    );

    if (docSnap.exists()) {
      return docSnap.data() as GeometryData;
    }

    return null;
  } catch (error) {
    console.error("Error loading geometry:", error);
    return null;
  }
}

// ============================================================================
// Full Example: Measurement Workflow
// ============================================================================

/*
export function MeasurementWorkflow({ jobId, roomId }: { jobId: string; roomId: string }) {
  const [geometry, setGeometry] = React.useState<GeometryData | null>(null);
  const { device } = useLaserDevice();
  const status = useLaserDeviceStatus();

  const handleWalkComplete = async (finalGeometry: GeometryData) => {
    setGeometry(finalGeometry);

    // Save to Firestore
    await saveGeometryToFirestore(jobId, roomId, finalGeometry);

    // Notification
    alert(`✓ Room measured: ${finalGeometry.area.toFixed(1)} sqft`);
  };

  return (
    <div className="p-4 space-y-4">
      {!device && (
        <div className="p-3 bg-yellow-50 rounded">
          <p>📡 No laser device connected</p>
          <ConnectLaserButton />
        </div>
      )}

      {device && (
        <>
          <LaserBatteryIndicator />

          {!geometry ? (
            <WalkTheRoomCapture onGeometryComplete={handleWalkComplete} />
          ) : (
            <div className="p-3 bg-green-50 rounded">
              <p className="font-semibold">✓ Geometry Saved</p>
              <p>Area: {geometry.area.toFixed(1)} sqft</p>
              <p>Perimeter: {geometry.perimeter.toFixed(1)} ft</p>

              <button
                onClick={() => setGeometry(null)}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
              >
                Capture Another Room
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
*/
