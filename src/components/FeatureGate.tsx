/**
 * Feature Gating Component Library
 *
 * Provides view-level components for conditional rendering
 * based on device class, feature set, and support level
 */

"use client";

import { useFeatures } from "@/lib/deviceDetectionProvider";
import type { DeviceClass, FeatureSet } from "@/lib/platformStrategy";
import React from "react";

// ============================================================================
// Gate by Feature Name
// ============================================================================

/**
 * <FeatureGate name="freehandDrawing">
 *   <ApplePencilInterface />
 * </FeatureGate>
 *
 * Only renders if device supports the feature
 */

export interface FeatureGateProps {
  name: keyof FeatureSet;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDeviceInfo?: boolean; // Debug: show why feature is unavailable
}

export function FeatureGate({
  name,
  children,
  fallback,
  showDeviceInfo = false,
}: FeatureGateProps) {
  const { device, canFeature } = useFeatures();

  if (!canFeature(name)) {
    if (fallback) return <>{fallback}</>;

    if (showDeviceInfo) {
      return (
        <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4 text-sm">
          <p className="font-semibold">Feature unavailable on {device.class}</p>
          <p className="text-xs text-muted">{name} is not supported</p>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

// ============================================================================
// Gate by Device Class
// ============================================================================

/**
 * <DeviceGate devices={["ipad"]}>
 *   <SideBySideCatalog />
 * </DeviceGate>
 *
 * Renders only on specified devices
 */

export interface DeviceGateProps {
  devices: DeviceClass | DeviceClass[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function DeviceGate({ devices, children, fallback }: DeviceGateProps) {
  const { device } = useFeatures();
  const targets = Array.isArray(devices) ? devices : [devices];

  if (!targets.includes(device.class)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================================================
// Gate by Form Factor
// ============================================================================

/**
 * <PhoneOnly>
 *   <CompactGeometryUI />
 * </PhoneOnly>
 */

export function PhoneOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { device } = useFeatures();
  return device.formFactor === "phone" ? <>{children}</> : <>{fallback}</>;
}

/**
 * <TabletOrLarger>
 *   <LargeCanvasView />
 * </TabletOrLarger>
 */

export function TabletOrLarger({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { device } = useFeatures();
  return device.formFactor !== "phone" ? <>{children}</> : <>{fallback}</>;
}

// ============================================================================
// Responsive Layout Helpers
// ============================================================================

/**
 * Adaptive layout that switches based on device
 *
 * <AdaptiveLayout
 *   phone={<StackedView />}
 *   tablet={<SideBySideView />}
 *   iPad={<FullPowerView />}
 * />
 */

export interface AdaptiveLayoutProps {
  ipad?: React.ReactNode;
  tablet?: React.ReactNode;
  phone?: React.ReactNode;
  default?: React.ReactNode;
}

export function AdaptiveLayout({
  ipad,
  tablet,
  phone,
  default: defaultView,
}: AdaptiveLayoutProps) {
  const { device } = useFeatures();

  if (device.class === "ipad" && ipad) return <>{ipad}</>;
  if (
    (device.class === "android-tablet" || device.class === "ipad") &&
    tablet
  ) {
    return <>{tablet}</>;
  }
  if (device.formFactor === "phone" && phone) return <>{phone}</>;

  return <>{defaultView}</>;
}

// ============================================================================
// Input Method Gates
// ============================================================================

/**
 * <ApplePencilOnly>
 *   <FreehandDrawingCanvas />
 * </ApplePencilOnly>
 *
 * Only on iPad with Apple Pencil
 */

export function ApplePencilOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { features } = useFeatures();
  return features.applePencil ? <>{children}</> : <>{fallback}</>;
}

/**
 * <BluetoothEnabled>
 *   <LeicaDistoBLE />
 * </BluetoothEnabled>
 *
 * All modern devices have Bluetooth LE
 */

export function BluetoothEnabled({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { device } = useFeatures();
  return device.hasBluetoothLE ? <>{children}</> : <>{fallback}</>;
}

// ============================================================================
// Workflow Gates
// ============================================================================

/**
 * <CanEditGeometry>
 *   <GeometryEditor />
 * </CanEditGeometry>
 *
 * Checks multiple conditions: editGeometry + not-readonly
 */

export function CanEditGeometry({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { features } = useFeatures();
  return features.editGeometry ? <>{children}</> : <>{fallback}</>;
}

/**
 * <CanOptimizeRollCut>
 *   <RollCutOptimizer />
 * </CanOptimizeRollCut>
 *
 * iPad-only feature
 */

export function CanOptimizeRollCut({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { features } = useFeatures();
  return features.rollCutOptimizer ? (
    <>{children}</>
  ) : (
    <>
      {fallback || (
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-center text-sm text-muted">
          Roll Cut optimizer is available on iPad
        </div>
      )}
    </>
  );
}

/**
 * <CanBrowseCatalog>
 *   <ProductCatalog />
 * </CanBrowseCatalog>
 */

export function CanBrowseCatalog({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { features } = useFeatures();
  return features.browseCatalog ? <>{children}</> : <>{fallback}</>;
}

// ============================================================================
// Status & Info Components
// ============================================================================

/**
 * Show current device info (for debugging)
 *
 * <DeviceInfo verbose={true} />
 */

export interface DeviceInfoProps {
  verbose?: boolean;
  className?: string;
}

export function DeviceInfo({
  verbose = false,
  className = "",
}: DeviceInfoProps) {
  const { device, isSupported } = useFeatures();

  if (!verbose) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        {device.class} • {device.formFactor}
      </div>
    );
  }

  return (
    <div
      className={`space-y-2 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm ${className}`}
    >
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="font-semibold">Device Class</div>
          <div className="text-xs">{device.class}</div>
        </div>
        <div>
          <div className="font-semibold">Form Factor</div>
          <div className="text-xs">{device.formFactor}</div>
        </div>
        <div>
          <div className="font-semibold">OS Version</div>
          <div className="text-xs">{device.osVersion}</div>
        </div>
        <div>
          <div className="font-semibold">Screen Size</div>
          <div className="text-xs">
            {device.screenDiagonal.toFixed(1)}&quot;
          </div>
        </div>
        <div>
          <div className="font-semibold">Bluetooth LE</div>
          <div className="text-xs">{device.hasBluetoothLE ? "✓" : "✗"}</div>
        </div>
        <div>
          <div className="font-semibold">Apple Pencil</div>
          <div className="text-xs">{device.hasApplePencil ? "✓" : "✗"}</div>
        </div>
      </div>
      <div>
        <div className="font-semibold">Support Level</div>
        <div className="text-xs">
          {isSupported ? "Supported" : "Unsupported"}
        </div>
      </div>
    </div>
  );
}

/**
 * Show unsupported device message
 */

export function UnsupportedDeviceMessage() {
  const { device, isSupported } = useFeatures();

  if (isSupported) return null;

  return (
    <div className="rounded-lg border-2 border-red-300 bg-red-50 p-6 text-center">
      <h2 className="text-lg font-semibold text-red-900">
        Device Not Supported
      </h2>
      <p className="mt-2 text-sm text-red-700">
        Square Flooring Pro Suite (Flooring OS) is optimized for iPad and recent
        iPhone models.
      </p>
      <p className="mt-1 text-xs text-red-600">
        Your device: <strong>{device.class}</strong> ({device.osVersion})
      </p>
      <p className="mt-4 text-xs text-red-600">
        Please use iPad, iPhone 16+, or Samsung Galaxy S24+
      </p>
    </div>
  );
}

// ============================================================================
// Example: Adaptive Geometry UI
// ============================================================================

/**
 * Complete example showing how different devices render different UIs
 *
 * iPad: Full drawing canvas + Apple Pencil + layers
 * iPhone: Tap-to-place + numeric input + Leica BLE
 * Android: Similar to iPhone
 */

export function GeometryUIAdapter() {
  const { device, features } = useFeatures();

  return (
    <div>
      {/* iPad: Full drawing experience */}
      {device.class === "ipad" && (
        <div className="flex h-full gap-4">
          <div className="flex-1">
            {features.freehandDrawing && (
              <div className="rounded-lg border border-green-300 bg-green-50 p-4">
                <h3 className="font-semibold">Apple Pencil Canvas</h3>
                <p className="text-sm">Freehand drawing enabled</p>
              </div>
            )}
          </div>
          <div className="w-64">
            {features.sideBySideCatalog && (
              <div className="rounded-lg border border-blue-300 bg-blue-50 p-4">
                <h3 className="font-semibold">Product Catalog</h3>
                <p className="text-sm">Side-by-side browsing</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* iPhone: Compact editing */}
      {device.class === "iphone" && (
        <div className="space-y-4">
          {features.leiacBluetooth && (
            <div className="rounded-lg border border-blue-300 bg-blue-50 p-4">
              <h3 className="font-semibold">Leica Disto Measuring</h3>
              <p className="text-sm">Tap to connect and measure</p>
            </div>
          )}
          {features.walkTheRoom && (
            <div className="rounded-lg border border-purple-300 bg-purple-50 p-4">
              <h3 className="font-semibold">Walk the Room</h3>
              <p className="text-sm">Measure as you walk the perimeter</p>
            </div>
          )}
          {features.tapToPlace && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-4">
              <h3 className="font-semibold">Tap to Place Points</h3>
              <p className="text-sm">Precise numeric input for coordinates</p>
            </div>
          )}
        </div>
      )}

      {/* Android: Subset of iPhone features */}
      {device.class?.includes("android") && (
        <div className="space-y-4">
          {features.leiacBluetooth && (
            <div className="rounded-lg border border-blue-300 bg-blue-50 p-4">
              <h3 className="font-semibold">Leica Disto Measuring</h3>
              <p className="text-sm">Professional measurement support</p>
            </div>
          )}
          {features.editGeometry && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-4">
              <h3 className="font-semibold">Geometry Editing</h3>
              <p className="text-sm">Draw and edit room layouts</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * <IfFeature name="freehandDrawing">
 *   <ApplePencilCanvas />
 * </IfFeature>
 */
export interface IfFeatureProps {
  name: keyof FeatureSet;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function IfFeature({ name, children, fallback }: IfFeatureProps) {
  const { canFeature } = useFeatures();
  return canFeature(name) ? <>{children}</> : <>{fallback || null}</>;
}

/**
 * <OnDevice device="ipad">
 *   <SideBySideCatalog />
 * </OnDevice>
 */
export interface OnDeviceProps {
  device: DeviceClass | DeviceClass[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function OnDevice({ device, children, fallback }: OnDeviceProps) {
  const { device: detectedDevice } = useFeatures();
  const targets = Array.isArray(device) ? device : [device];
  const matches = targets.includes(detectedDevice.class);
  return matches ? <>{children}</> : <>{fallback || null}</>;
}
