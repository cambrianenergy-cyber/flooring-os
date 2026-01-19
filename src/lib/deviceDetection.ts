/**
 * Device Detection Utilities (Pure TS, no React/JSX)
 * 
 * Detects device class, form factor, and capabilities from UA or native bridge
 */

import {
  DeviceClass,
  DeviceInfo,
  FeatureSet,
  FEATURES_BY_DEVICE,
  SUPPORTED_DEVICES,
} from "@/lib/platformStrategy";

/**
 * Web-based device detection
 * Parses User-Agent and screen dimensions to infer device type
 */
export class WebDeviceDetector {
  private userAgent: string;
  private windowWidth: number;
  private windowHeight: number;

  constructor(userAgent?: string, windowWidth?: number, windowHeight?: number) {
    this.userAgent = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
    this.windowWidth = windowWidth || (typeof window !== "undefined" ? window.innerWidth : 0);
    this.windowHeight = windowHeight || (typeof window !== "undefined" ? window.innerHeight : 0);
  }

  /**
   * Detect device class from User-Agent
   */
  detectClass(): DeviceClass {
    const ua = this.userAgent.toLowerCase();

    // iPad
    if (ua.includes("ipad") || (ua.includes("macintosh") && this.isTouchDevice())) {
      return "ipad";
    }

    // iPhone
    if (ua.includes("iphone")) {
      return "iphone";
    }

    // Android phone vs tablet
    if (ua.includes("android")) {
      if (this.windowWidth > 600) {
        return "android-tablet";
      }
      return "android-phone";
    }

    // Samsung Galaxy
    if (ua.includes("samsung")) {
      if (ua.includes("tablet")) {
        return "android-tablet";
      }
      return "android-phone";
    }

    // Google Pixel
    if (ua.includes("pixel")) {
      return "android-phone";
    }

    return "unknown";
  }

  /**
   * Detect form factor
   */
  detectFormFactor(): "phone" | "tablet" | "desktop" {
    const screenDiagonal = this.estimateScreenDiagonal();

    if (screenDiagonal < 5.5) {
      return "phone";
    } else if (screenDiagonal < 7.0) {
      return "phone";
    } else if (screenDiagonal < 10.5) {
      return "tablet";
    }
    return "tablet";
  }

  /**
   * Estimate screen diagonal in inches
   */
  private estimateScreenDiagonal(): number {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    const physicalWidth = this.windowWidth / dpr;
    const physicalHeight = this.windowHeight / dpr;

    const dpi = dpr >= 3 ? 264 : 163;
    const diagonalPixels = Math.sqrt(physicalWidth ** 2 + physicalHeight ** 2);
    return diagonalPixels / dpi;
  }

  /**
   * Check for touch support
   */
  private isTouchDevice(): boolean {
    return typeof window !== "undefined" && 
           (("ontouchstart" in window) || 
            (navigator && "maxTouchPoints" in navigator && navigator.maxTouchPoints > 0));
  }

  /**
   * Detect OS version
   */
  detectOSVersion(): string {
    const ua = this.userAgent;

    if (ua.includes("OS ")) {
      const match = ua.match(/OS (\d+_\d+)/);
      if (match) {
        return match[1].replace(/_/, ".");
      }
    }

    if (ua.includes("Android ")) {
      const match = ua.match(/Android (\d+(\.\d+)?)/);
      if (match) {
        return match[1];
      }
    }

    return "unknown";
  }

  /**
   * Check for Bluetooth LE capability
   */
  detectBluetooth(): boolean {
    if (typeof navigator === "undefined") return false;
    return (
      "bluetooth" in navigator ||
      (typeof (navigator as Navigator & { bluetooth?: { requestDevice?: unknown } }).bluetooth !== "undefined" &&
        "requestDevice" in (navigator as Navigator & { bluetooth?: { requestDevice?: unknown } }).bluetooth!) ||
      false
    );
  }

  /**
   * Check for Camera API
   */
  detectCamera(): boolean {
    if (typeof navigator === "undefined") return false;
    return (
      "mediaDevices" in navigator &&
      "getUserMedia" in (navigator.mediaDevices || {})
    );
  }

  /**
   * Check for NFC
   */
  detectNFC(): boolean {
    if (typeof navigator === "undefined") return false;
    return "nfc" in (navigator as Navigator & { nfc?: unknown }) || false;
  }

  /**
   * Compile full DeviceInfo
   */
  detect(): DeviceInfo {
    const deviceClass = this.detectClass();
    const formFactor = this.detectFormFactor();
    const osVersion = this.detectOSVersion();
    const screenDiagonal = this.estimateScreenDiagonal();

    return {
      class: deviceClass,
      formFactor,
      osVersion,
      screenWidth: this.windowWidth,
      screenHeight: this.windowHeight,
      screenDiagonal,
      hasBluetoothLE: this.detectBluetooth(),
      hasApplePencil: deviceClass === "ipad",
      hasNFC: this.detectNFC(),
      maxConcurrentBLEConnections: deviceClass === "ipad" ? 4 : 1,
    };
  }
}

/**
 * Native bridge for iOS/Android apps
 */
export interface NativeDeviceInfo {
  class: DeviceClass;
  osVersion: string;
  modelName: string;
  screenDiagonal: number;
  hasBluetoothLE: boolean;
  hasApplePencil: boolean;
  hasNFC: boolean;
}

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        deviceInfo?: {
          postMessage: (data: unknown) => void;
        };
      };
    };
    android?: {
      getDeviceInfo?: () => string;
    };
  }
}

export class NativeBridge {
  /**
   * Request device info from native code
   * iOS: webkit.messageHandlers.deviceInfo.postMessage()
   * Android: window.android.getDeviceInfo()
   */
  static async getDeviceInfo(): Promise<NativeDeviceInfo | null> {
    if (typeof window === "undefined") return null;

    // iOS
    if (window.webkit?.messageHandlers?.deviceInfo) {
      return new Promise((resolve) => {
        window.webkit!.messageHandlers!.deviceInfo!.postMessage({
          action: "getInfo",
          callback: (data: NativeDeviceInfo) => resolve(data),
        });
      });
    }

    // Android
    if (window.android?.getDeviceInfo) {
      const jsonString = window.android.getDeviceInfo();
      return JSON.parse(jsonString) as NativeDeviceInfo;
    }

    return null;
  }

  /**
   * Send feature capability check to native code
   */
  static async checkCapability(capability: string): Promise<boolean> {
    const nativeInfo = await this.getDeviceInfo();
    if (!nativeInfo) return false;

    const features = FEATURES_BY_DEVICE[nativeInfo.class];
    return features[capability as keyof typeof features] === true;
  }
}

// Re-export types
export type { DeviceClass, DeviceInfo, FeatureSet };
export { FEATURES_BY_DEVICE, SUPPORTED_DEVICES };
