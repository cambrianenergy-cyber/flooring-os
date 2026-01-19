/**
 * Feature Gating Provider & Hooks (React Context)
 * 
 * Wraps detection logic with React Context for consuming components
 * Use this in your layout.tsx to wrap the entire app
 */

"use client";

import React, { createContext, useContext } from "react";
import { WebDeviceDetector, NativeBridge } from "@/lib/deviceDetection";
import {
  DeviceClass,
  DeviceInfo,
  FeatureSet,
  FEATURES_BY_DEVICE,
  SUPPORTED_DEVICES,
} from "@/lib/platformStrategy";

/**
 * Feature context type
 */
export interface FeaturesContextType {
  device: DeviceInfo;
  features: FeatureSet;
  isSupported: boolean;
  canFeature: (featureName: keyof FeatureSet) => boolean;
}

const FeaturesContext = createContext<FeaturesContextType | null>(null);

/**
 * Wrap your app with this provider (in layout.tsx)
 * 
 * Usage:
 *   <FeaturesProvider>{children}</FeaturesProvider>
 */
export function FeaturesProvider({ children }: { children: React.ReactNode }) {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo | null>(null);

  React.useEffect(() => {
    async function initDevice() {
      // Try native bridge first (iOS/Android)
      const nativeInfo = await NativeBridge.getDeviceInfo();
      
      if (nativeInfo) {
        setDeviceInfo({
          class: nativeInfo.class,
          formFactor: nativeInfo.class === "ipad" ? "tablet" : "phone",
          osVersion: nativeInfo.osVersion,
          screenWidth: 0,
          screenHeight: 0,
          screenDiagonal: nativeInfo.screenDiagonal,
          hasBluetoothLE: nativeInfo.hasBluetoothLE,
          hasApplePencil: nativeInfo.hasApplePencil,
          hasNFC: nativeInfo.hasNFC,
          maxConcurrentBLEConnections: nativeInfo.class === "ipad" ? 4 : 1,
        });
      } else {
        // Fallback to web detection
        const detector = new WebDeviceDetector();
        setDeviceInfo(detector.detect());
      }
    }

    initDevice();
  }, []);

  if (!deviceInfo) {
    // Loading state: render children without features context
    return <>{children}</>;
  }

  const features = FEATURES_BY_DEVICE[deviceInfo.class];
  const isSupported = SUPPORTED_DEVICES.some((d: typeof SUPPORTED_DEVICES[0]) => {
    return d.class === deviceInfo.class;
  });

  const value: FeaturesContextType = {
    device: deviceInfo,
    features,
    isSupported,
    canFeature: (name: keyof FeatureSet) => features[name] as boolean,
  };

  return (
    <FeaturesContext.Provider value={value}>
      {children}
    </FeaturesContext.Provider>
  );
}

/**
 * Hook to access feature context
 * Must be called inside <FeaturesProvider>
 */
export function useFeatures(): FeaturesContextType {
  const context = useContext(FeaturesContext);
  if (!context) {
    throw new Error("useFeatures must be used within FeaturesProvider");
  }
  return context;
}

/**
 * Helper: Check if a feature is enabled
 */
export function useCanFeature(name: keyof FeatureSet): boolean {
  const { canFeature } = useFeatures();
  return canFeature(name);
}

/**
 * Helper: Get current device class
 */
export function useDeviceClass(): DeviceClass {
  const { device } = useFeatures();
  return device.class;
}

/**
 * Helper: Check if device is supported
 */
export function useIsSupported(): boolean {
  const { isSupported } = useFeatures();
  return isSupported;
}

// Re-export types for convenience
export type { DeviceClass, DeviceInfo, FeatureSet };
