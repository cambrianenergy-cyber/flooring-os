/**
 * PLATFORM STRATEGY & DEVICE CAPABILITY MATRIX
 * 
 * Non-negotiable rules that govern device support, feature parity, and UX design:
 * 
 * Rule #1: iPad is the full-power workstation. Everything exists there.
 * Rule #2: iPhone is a field companion. It measures, edits, signs, presents.
 * Rule #3: Android support is selective, not universal. Professional grade only.
 * 
 * This keeps performance tight, support focused, and user experience intentional.
 */

// ============================================================================
// DEVICE CLASSES
// ============================================================================

export type DeviceClass = 'ipad' | 'iphone' | 'android-phone' | 'android-tablet' | 'unknown';
export type FormFactor = 'phone' | 'tablet' | 'desktop';

export interface DeviceInfo {
  class: DeviceClass;
  formFactor: FormFactor;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  screenDiagonal: number; // inches
  hasBluetoothLE: boolean;
  hasApplePencil: boolean; // iPad only
  hasNFC: boolean;
  maxConcurrentBLEConnections: number;
}

// ============================================================================
// DEVICE DETECTION
// ============================================================================

export function detectDevice(): DeviceInfo {
  // Placeholder - will be implemented with actual detection logic
  // Uses User-Agent parsing + device APIs to determine class
  return {
    class: 'unknown',
    formFactor: 'phone',
    osVersion: '',
    screenWidth: 0,
    screenHeight: 0,
    screenDiagonal: 0,
    hasBluetoothLE: false,
    hasApplePencil: false,
    hasNFC: false,
    maxConcurrentBLEConnections: 1,
  };
}

// ============================================================================
// FEATURE CAPABILITY MATRIX
// ============================================================================

/**
 * Capabilities = what a device can DO (not what it SHOULD do by UX)
 * Features = what we CHOOSE to enable on a device
 * 
 * Example:
 *   iPhone 16 CAN do freehand drawing (capability)
 *   But we DON'T enable it (feature gating) because it's not the UX
 */

export interface DeviceCapabilities {
  // Hardware
  bluetoothLE: boolean;
  applePencil: boolean;
  nfc: boolean;
  camera: boolean;
  gps: boolean;
  accelerometer: boolean;

  // Software stack
  native: boolean; // SwiftUI, Jetpack Compose
  webCapable: boolean; // Browser/WebView
  offlineStorage: number; // bytes

  // Connectivity
  backgroundSync: boolean;
  backgroundBLE: boolean; // Can stay connected while backgrounded
  hotspot: boolean;

  // Display
  screenDiagonal: number; // inches
  maxZoomLevels: number;
  supportsMultiTouch: boolean;
}

export const CAPABILITIES_BY_DEVICE: Record<DeviceClass, DeviceCapabilities> = {
  ipad: {
    bluetoothLE: true,
    applePencil: true,
    nfc: true,
    camera: true,
    gps: true,
    accelerometer: true,
    native: true,
    webCapable: true,
    offlineStorage: 50 * 1024 * 1024 * 1024, // 50GB
    backgroundSync: true,
    backgroundBLE: true,
    hotspot: true,
    screenDiagonal: 10.9, // assume 11" iPad Air
    maxZoomLevels: 10,
    supportsMultiTouch: true,
  },

  iphone: {
    bluetoothLE: true,
    applePencil: false, // No Apple Pencil support on phone
    nfc: true,
    camera: true,
    gps: true,
    accelerometer: true,
    native: true,
    webCapable: true,
    offlineStorage: 10 * 1024 * 1024 * 1024, // 10GB
    backgroundSync: true,
    backgroundBLE: true,
    hotspot: false,
    screenDiagonal: 6.3, // assume iPhone 16
    maxZoomLevels: 6,
    supportsMultiTouch: true,
  },

  'android-phone': {
    bluetoothLE: true,
    applePencil: false,
    nfc: true,
    camera: true,
    gps: true,
    accelerometer: true,
    native: true,
    webCapable: true,
    offlineStorage: 10 * 1024 * 1024 * 1024,
    backgroundSync: true,
    backgroundBLE: true,
    hotspot: false,
    screenDiagonal: 6.5, // assume Galaxy S24
    maxZoomLevels: 6,
    supportsMultiTouch: true,
  },

  'android-tablet': {
    bluetoothLE: true,
    applePencil: false,
    nfc: true,
    camera: true,
    gps: true,
    accelerometer: true,
    native: true,
    webCapable: true,
    offlineStorage: 30 * 1024 * 1024 * 1024, // 30GB
    backgroundSync: true,
    backgroundBLE: true,
    hotspot: false,
    screenDiagonal: 10.5, // assume Galaxy Tab S10
    maxZoomLevels: 8,
    supportsMultiTouch: true,
  },

  unknown: {
    bluetoothLE: false,
    applePencil: false,
    nfc: false,
    camera: false,
    gps: false,
    accelerometer: false,
    native: false,
    webCapable: true,
    offlineStorage: 0,
    backgroundSync: false,
    backgroundBLE: false,
    hotspot: false,
    screenDiagonal: 0,
    maxZoomLevels: 3,
    supportsMultiTouch: false,
  },
};

// ============================================================================
// FEATURE MATRIX: What FEATURES we enable per device
// ============================================================================

export interface FeatureSet {
  // Drawing & editing
  freehandDrawing: boolean; // Pencil-style, curves
  assistedDraw: boolean; // Snap-to-grid, straight lines
  tapToPlace: boolean; // Click exact points
  dragWalls: boolean; // Move/edit segments
  numericInput: boolean; // Type coordinates

  // Input methods
  applePencil: boolean;
  leiacBluetooth: boolean;
  walkTheRoom: boolean; // Walk perimeter + phone measures
  rectBySize: boolean; // Input width/height, auto-place

  // Room management
  createRooms: boolean;
  renameRooms: boolean;
  deleteRooms: boolean;
  multiRoomView: boolean; // See all rooms at once
  multiRoomEdit: boolean; // Edit multiple rooms on canvas

  // Geometry
  closePolygon: boolean; // Close room geometry
  viewGeometry: boolean; // See room outline
  editGeometry: boolean; // Modify points/segments
  exportGeometry: boolean; // Send to Firestore

  // Photos & annotations
  takePhotos: boolean;
  linkPhotosToWalls: boolean;
  annotatePhotos: boolean;
  viewPhotoOverlays: boolean;

  // Products & pricing
  browseCatalog: boolean;
  filterProducts: boolean;
  compareProducts: boolean;
  sideBySideCatalog: boolean; // Two windows, iPad only
  assignProductsToRooms: boolean;
  editPricing: boolean;

  // Estimates & proposals
  viewEstimates: boolean;
  editEstimates: boolean;
  generatePDF: boolean;
  sendProposal: boolean;
  captureSignature: boolean;

  // Advanced workflows
  rollCutOptimizer: boolean; // Seam planning, waste calc
  rollCutVisualization: boolean; // See layout on canvas
  installerCutSheets: boolean; // Generate step-by-step
  multiRoomPlanOverview: boolean; // See all rooms + plans

  // Offline & sync
  offlineMode: boolean;
  localFirstSync: boolean; // CRDT, pending queue
  backgroundSync: boolean;
  conflictResolution: boolean;
}

export const FEATURES_BY_DEVICE: Record<DeviceClass, FeatureSet> = {
  ipad: {
    // === Drawing & editing ===
    freehandDrawing: true, // iPad + Apple Pencil magic
    assistedDraw: true,
    tapToPlace: true,
    dragWalls: true,
    numericInput: true,

    // === Input methods ===
    applePencil: true,
    leiacBluetooth: true,
    walkTheRoom: false, // Not practical on big device
    rectBySize: true,

    // === Room management ===
    createRooms: true,
    renameRooms: true,
    deleteRooms: true,
    multiRoomView: true, // iPad canvas is big enough
    multiRoomEdit: true,

    // === Geometry ===
    closePolygon: true,
    viewGeometry: true,
    editGeometry: true,
    exportGeometry: true,

    // === Photos ===
    takePhotos: true,
    linkPhotosToWalls: true,
    annotatePhotos: true,
    viewPhotoOverlays: true,

    // === Products ===
    browseCatalog: true,
    filterProducts: true,
    compareProducts: true,
    sideBySideCatalog: true, // iPad width supports it
    assignProductsToRooms: true,
    editPricing: true,

    // === Estimates ===
    viewEstimates: true,
    editEstimates: true,
    generatePDF: true,
    sendProposal: true,
    captureSignature: true,

    // === Advanced ===
    rollCutOptimizer: true,
    rollCutVisualization: true,
    installerCutSheets: true,
    multiRoomPlanOverview: true,

    // === Sync ===
    offlineMode: true,
    localFirstSync: true,
    backgroundSync: true,
    conflictResolution: true,
  },

  iphone: {
    // === Drawing & editing ===
    freehandDrawing: false, // Too cramped, not the UX
    assistedDraw: true, // Tap + drag for lines
    tapToPlace: true, // Tap to add point (main method)
    dragWalls: true, // Drag existing point
    numericInput: true, // Type exact coordinate

    // === Input methods ===
    applePencil: false,
    leiacBluetooth: true, // Core feature for field work
    walkTheRoom: true, // CRITICAL for phone: measure as you walk
    rectBySize: true, // Quick room: "20x15 feet"

    // === Room management ===
    createRooms: true,
    renameRooms: true,
    deleteRooms: true,
    multiRoomView: false, // Phone screen too small
    multiRoomEdit: false,

    // === Geometry ===
    closePolygon: true,
    viewGeometry: true,
    editGeometry: true,
    exportGeometry: true,

    // === Photos ===
    takePhotos: true, // Phone is great camera
    linkPhotosToWalls: true,
    annotatePhotos: false, // Too small for detailed markup
    viewPhotoOverlays: true,

    // === Products ===
    browseCatalog: true,
    filterProducts: true,
    compareProducts: false, // Hard to compare side-by-side on phone
    sideBySideCatalog: false,
    assignProductsToRooms: true,
    editPricing: true,

    // === Estimates ===
    viewEstimates: true,
    editEstimates: true, // Quick edits in field
    generatePDF: true,
    sendProposal: true,
    captureSignature: true, // Core: sign on site

    // === Advanced ===
    rollCutOptimizer: false, // Desktop/tablet job
    rollCutVisualization: false,
    installerCutSheets: false, // View only (no planning)
    multiRoomPlanOverview: false, // Too small

    // === Sync ===
    offlineMode: true, // CRITICAL: basements, job sites
    localFirstSync: true,
    backgroundSync: true,
    conflictResolution: true,
  },

  'android-phone': {
    // === Drawing & editing ===
    freehandDrawing: false,
    assistedDraw: true,
    tapToPlace: true,
    dragWalls: true,
    numericInput: true,

    // === Input methods ===
    applePencil: false,
    leiacBluetooth: true,
    walkTheRoom: true,
    rectBySize: true,

    // === Room management ===
    createRooms: true,
    renameRooms: true,
    deleteRooms: true,
    multiRoomView: false,
    multiRoomEdit: false,

    // === Geometry ===
    closePolygon: true,
    viewGeometry: true,
    editGeometry: true,
    exportGeometry: true,

    // === Photos ===
    takePhotos: true,
    linkPhotosToWalls: true,
    annotatePhotos: false,
    viewPhotoOverlays: true,

    // === Products ===
    browseCatalog: true,
    filterProducts: true,
    compareProducts: false,
    sideBySideCatalog: false,
    assignProductsToRooms: true,
    editPricing: true,

    // === Estimates ===
    viewEstimates: true,
    editEstimates: true,
    generatePDF: true,
    sendProposal: true,
    captureSignature: true,

    // === Advanced ===
    rollCutOptimizer: false,
    rollCutVisualization: false,
    installerCutSheets: false,
    multiRoomPlanOverview: false,

    // === Sync ===
    offlineMode: true,
    localFirstSync: true,
    backgroundSync: true,
    conflictResolution: true,
  },

  'android-tablet': {
    // === Drawing & editing ===
    freehandDrawing: false, // No stylus support (selective Android)
    assistedDraw: true,
    tapToPlace: true,
    dragWalls: true,
    numericInput: true,

    // === Input methods ===
    applePencil: false,
    leiacBluetooth: true,
    walkTheRoom: false,
    rectBySize: true,

    // === Room management ===
    createRooms: true,
    renameRooms: true,
    deleteRooms: true,
    multiRoomView: true, // Tablet width allows it
    multiRoomEdit: false, // (No multi-edit for tablets, iPad-only)

    // === Geometry ===
    closePolygon: true,
    viewGeometry: true,
    editGeometry: true,
    exportGeometry: true,

    // === Photos ===
    takePhotos: true,
    linkPhotosToWalls: true,
    annotatePhotos: false,
    viewPhotoOverlays: true,

    // === Products ===
    browseCatalog: true,
    filterProducts: true,
    compareProducts: true,
    sideBySideCatalog: false, // Not as wide as iPad
    assignProductsToRooms: true,
    editPricing: true,

    // === Estimates ===
    viewEstimates: true,
    editEstimates: true,
    generatePDF: true,
    sendProposal: true,
    captureSignature: true,

    // === Advanced ===
    rollCutOptimizer: false, // Selective: professionals only
    rollCutVisualization: false,
    installerCutSheets: false,
    multiRoomPlanOverview: false,

    // === Sync ===
    offlineMode: true,
    localFirstSync: true,
    backgroundSync: true,
    conflictResolution: true,
  },

  unknown: {
    // Safe defaults: enable only basics
    freehandDrawing: false,
    assistedDraw: false,
    tapToPlace: false,
    dragWalls: false,
    numericInput: false,
    applePencil: false,
    leiacBluetooth: false,
    walkTheRoom: false,
    rectBySize: false,
    createRooms: false,
    renameRooms: false,
    deleteRooms: false,
    multiRoomView: false,
    multiRoomEdit: false,
    closePolygon: false,
    viewGeometry: false,
    editGeometry: false,
    exportGeometry: false,
    takePhotos: false,
    linkPhotosToWalls: false,
    annotatePhotos: false,
    viewPhotoOverlays: false,
    browseCatalog: false,
    filterProducts: false,
    compareProducts: false,
    sideBySideCatalog: false,
    assignProductsToRooms: false,
    editPricing: false,
    viewEstimates: false,
    editEstimates: false,
    generatePDF: false,
    sendProposal: false,
    captureSignature: false,
    rollCutOptimizer: false,
    rollCutVisualization: false,
    installerCutSheets: false,
    multiRoomPlanOverview: false,
    offlineMode: false,
    localFirstSync: false,
    backgroundSync: false,
    conflictResolution: false,
  },
};

// ============================================================================
// SUPPORTED DEVICES (Whitelist)
// ============================================================================

export interface SupportedDevice {
  brand: string;
  model: string;
  minOSVersion: string;
  class: DeviceClass;
  supportLevel: 'full' | 'partial' | 'readonly'; // full=edit, partial=some features, readonly=view only
  note?: string;
}

export const SUPPORTED_DEVICES: SupportedDevice[] = [
  // ===== iPad (Full Support) =====
  { brand: 'Apple', model: 'iPad Air (5th gen+)', minOSVersion: '16.0', class: 'ipad', supportLevel: 'full' },
  { brand: 'Apple', model: 'iPad Pro (11-inch)', minOSVersion: '16.0', class: 'ipad', supportLevel: 'full' },
  { brand: 'Apple', model: 'iPad Pro (12.9-inch)', minOSVersion: '16.0', class: 'ipad', supportLevel: 'full' },
  { brand: 'Apple', model: 'iPad (10th gen+)', minOSVersion: '16.0', class: 'ipad', supportLevel: 'full' },
  { brand: 'Apple', model: 'iPad mini (6th gen+)', minOSVersion: '16.0', class: 'ipad', supportLevel: 'full' },

  // ===== iPhone (Full Support) =====
  { brand: 'Apple', model: 'iPhone 16', minOSVersion: '18.0', class: 'iphone', supportLevel: 'full' },
  { brand: 'Apple', model: 'iPhone 16 Plus', minOSVersion: '18.0', class: 'iphone', supportLevel: 'full' },
  { brand: 'Apple', model: 'iPhone 16 Pro', minOSVersion: '18.0', class: 'iphone', supportLevel: 'full' },
  { brand: 'Apple', model: 'iPhone 16 Pro Max', minOSVersion: '18.0', class: 'iphone', supportLevel: 'full' },
  { brand: 'Apple', model: 'iPhone 17*', minOSVersion: '19.0', class: 'iphone', supportLevel: 'full', note: 'Future models' },

  // ===== Android Phone (Professional) =====
  { brand: 'Samsung', model: 'Galaxy S24', minOSVersion: '14.0', class: 'android-phone', supportLevel: 'full' },
  { brand: 'Samsung', model: 'Galaxy S24 Ultra', minOSVersion: '14.0', class: 'android-phone', supportLevel: 'full' },
  { brand: 'Samsung', model: 'Galaxy S25*', minOSVersion: '15.0', class: 'android-phone', supportLevel: 'full', note: 'Future' },
  { brand: 'Google', model: 'Pixel 9', minOSVersion: '14.0', class: 'android-phone', supportLevel: 'full' },
  { brand: 'Google', model: 'Pixel 9 Pro', minOSVersion: '14.0', class: 'android-phone', supportLevel: 'full' },
  { brand: 'Google', model: 'Pixel 10*', minOSVersion: '15.0', class: 'android-phone', supportLevel: 'full', note: 'Future' },

  // ===== Android Tablet (Optional Phase) =====
  { brand: 'Samsung', model: 'Galaxy Tab S10', minOSVersion: '14.0', class: 'android-tablet', supportLevel: 'partial' },
  { brand: 'Samsung', model: 'Galaxy Tab S10 Ultra', minOSVersion: '14.0', class: 'android-tablet', supportLevel: 'partial' },
];

/**
 * Helper: Check if device is supported
 */
export function isDeviceSupported(brand: string, model: string, osVersion: string): boolean {
  return SUPPORTED_DEVICES.some((device) => {
    const brandMatch = device.brand.toLowerCase() === brand.toLowerCase();
    const modelMatch =
      device.model.endsWith('*')
        ? model.toLowerCase().startsWith(device.model.slice(0, -1).toLowerCase())
        : device.model.toLowerCase() === model.toLowerCase();
    const osMatch = parseFloat(osVersion) >= parseFloat(device.minOSVersion);
    return brandMatch && modelMatch && osMatch;
  });
}

// ============================================================================
// SUMMARY: Design Principles
// ============================================================================

/**
 * Why this strategy works:
 * 
 * 1. INTENTIONAL DEVICE HIERARCHY
 *    iPad = creative/planning workstation, everything possible
 *    iPhone = field companion, focused on measurement + signature
 *    Android = selective professionals, no bloat
 * 
 * 2. AVOID FEATURE CREEP
 *    By gating features by device, we avoid:
 *    - "Can we do X on phone?" → No, it's not the UX
 *    - "Why doesn't Android have Y?" → It's iPad-only by design
 *    - Support nightmares from cramped UI
 * 
 * 3. PERFORMANCE = SIMPLICITY
 *    Each device builds what it needs:
 *    - iPad SwiftUI: Full drawing stack, Metal graphics
 *    - iPhone SwiftUI: Lightweight UI, Leica BLE focus
 *    - Android: Jetpack Compose, professional features only
 *    No trying to be all things to all devices
 * 
 * 4. PROFESSIONAL IMAGE
 *    "We don't support all Android" signals quality:
 *    - Flooring pros use iPhones or Galaxy S-series
 *    - They expect polish, not broad compatibility
 *    - Android support is credible (Samsung/Google flagships)
 * 
 * 5. OFFLINE-FIRST IS UNIVERSAL
 *    All devices (iPad, iPhone, Android) support:
 *    - Local GRDB storage
 *    - Background sync
 *    - Conflict resolution
 *    Field work doesn't wait for network
 */
