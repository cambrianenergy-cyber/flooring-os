/**
 * Platform Strategy Types
 * 
 * Exported from separate file for proper TS module resolution
 */

export type DeviceClass = "ipad" | "iphone" | "android-phone" | "android-tablet" | "unknown";
export type FormFactor = "phone" | "tablet" | "desktop";

export interface DeviceInfo {
  class: DeviceClass;
  formFactor: FormFactor;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  screenDiagonal: number;
  hasBluetoothLE: boolean;
  hasApplePencil: boolean;
  hasNFC: boolean;
  maxConcurrentBLEConnections: number;
}

export interface DeviceCapabilities {
  bluetoothLE: boolean;
  applePencil: boolean;
  nfc: boolean;
  camera: boolean;
  gps: boolean;
  accelerometer: boolean;
  native: boolean;
  webCapable: boolean;
  offlineStorage: number;
  backgroundSync: boolean;
  backgroundBLE: boolean;
  hotspot: boolean;
  screenDiagonal: number;
  maxZoomLevels: number;
  supportsMultiTouch: boolean;
}

export interface FeatureSet {
  // Drawing & editing
  freehandDrawing: boolean;
  assistedDraw: boolean;
  tapToPlace: boolean;
  dragWalls: boolean;
  numericInput: boolean;

  // Input methods
  applePencil: boolean;
  leiacBluetooth: boolean;
  walkTheRoom: boolean;
  rectBySize: boolean;

  // Room management
  createRooms: boolean;
  renameRooms: boolean;
  deleteRooms: boolean;
  multiRoomView: boolean;
  multiRoomEdit: boolean;

  // Geometry
  closePolygon: boolean;
  viewGeometry: boolean;
  editGeometry: boolean;
  exportGeometry: boolean;

  // Photos & annotations
  takePhotos: boolean;
  linkPhotosToWalls: boolean;
  annotatePhotos: boolean;
  viewPhotoOverlays: boolean;

  // Products & pricing
  browseCatalog: boolean;
  filterProducts: boolean;
  compareProducts: boolean;
  sideBySideCatalog: boolean;
  assignProductsToRooms: boolean;
  editPricing: boolean;

  // Estimates & proposals
  viewEstimates: boolean;
  editEstimates: boolean;
  generatePDF: boolean;
  sendProposal: boolean;
  captureSignature: boolean;

  // Advanced workflows
  rollCutOptimizer: boolean;
  rollCutVisualization: boolean;
  installerCutSheets: boolean;
  multiRoomPlanOverview: boolean;

  // Offline & sync
  offlineMode: boolean;
  localFirstSync: boolean;
  backgroundSync: boolean;
  conflictResolution: boolean;
}

export interface SupportedDevice {
  brand: string;
  model: string;
  minOSVersion: string;
  class: DeviceClass;
  supportLevel: "full" | "partial" | "readonly";
  note?: string;
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
    offlineStorage: 50 * 1024 * 1024 * 1024,
    backgroundSync: true,
    backgroundBLE: true,
    hotspot: true,
    screenDiagonal: 10.9,
    maxZoomLevels: 10,
    supportsMultiTouch: true,
  },
  iphone: {
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
    screenDiagonal: 6.3,
    maxZoomLevels: 6,
    supportsMultiTouch: true,
  },
  "android-phone": {
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
    screenDiagonal: 6.5,
    maxZoomLevels: 6,
    supportsMultiTouch: true,
  },
  "android-tablet": {
    bluetoothLE: true,
    applePencil: false,
    nfc: true,
    camera: true,
    gps: true,
    accelerometer: true,
    native: true,
    webCapable: true,
    offlineStorage: 30 * 1024 * 1024 * 1024,
    backgroundSync: true,
    backgroundBLE: true,
    hotspot: false,
    screenDiagonal: 10.5,
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

export const FEATURES_BY_DEVICE: Record<DeviceClass, FeatureSet> = {
  ipad: {
    freehandDrawing: true,
    assistedDraw: true,
    tapToPlace: true,
    dragWalls: true,
    numericInput: true,
    applePencil: true,
    leiacBluetooth: true,
    walkTheRoom: false,
    rectBySize: true,
    createRooms: true,
    renameRooms: true,
    deleteRooms: true,
    multiRoomView: true,
    multiRoomEdit: true,
    closePolygon: true,
    viewGeometry: true,
    editGeometry: true,
    exportGeometry: true,
    takePhotos: true,
    linkPhotosToWalls: true,
    annotatePhotos: true,
    viewPhotoOverlays: true,
    browseCatalog: true,
    filterProducts: true,
    compareProducts: true,
    sideBySideCatalog: true,
    assignProductsToRooms: true,
    editPricing: true,
    viewEstimates: true,
    editEstimates: true,
    generatePDF: true,
    sendProposal: true,
    captureSignature: true,
    rollCutOptimizer: true,
    rollCutVisualization: true,
    installerCutSheets: true,
    multiRoomPlanOverview: true,
    offlineMode: true,
    localFirstSync: true,
    backgroundSync: true,
    conflictResolution: true,
  },
  iphone: {
    freehandDrawing: false,
    assistedDraw: true,
    tapToPlace: true,
    dragWalls: true,
    numericInput: true,
    applePencil: false,
    leiacBluetooth: true,
    walkTheRoom: true,
    rectBySize: true,
    createRooms: true,
    renameRooms: true,
    deleteRooms: true,
    multiRoomView: false,
    multiRoomEdit: false,
    closePolygon: true,
    viewGeometry: true,
    editGeometry: true,
    exportGeometry: true,
    takePhotos: true,
    linkPhotosToWalls: true,
    annotatePhotos: false,
    viewPhotoOverlays: true,
    browseCatalog: true,
    filterProducts: true,
    compareProducts: false,
    sideBySideCatalog: false,
    assignProductsToRooms: true,
    editPricing: true,
    viewEstimates: true,
    editEstimates: true,
    generatePDF: true,
    sendProposal: true,
    captureSignature: true,
    rollCutOptimizer: false,
    rollCutVisualization: false,
    installerCutSheets: false,
    multiRoomPlanOverview: false,
    offlineMode: true,
    localFirstSync: true,
    backgroundSync: true,
    conflictResolution: true,
  },
  "android-phone": {
    freehandDrawing: false,
    assistedDraw: true,
    tapToPlace: true,
    dragWalls: true,
    numericInput: true,
    applePencil: false,
    leiacBluetooth: true,
    walkTheRoom: true,
    rectBySize: true,
    createRooms: true,
    renameRooms: true,
    deleteRooms: true,
    multiRoomView: false,
    multiRoomEdit: false,
    closePolygon: true,
    viewGeometry: true,
    editGeometry: true,
    exportGeometry: true,
    takePhotos: true,
    linkPhotosToWalls: true,
    annotatePhotos: false,
    viewPhotoOverlays: true,
    browseCatalog: true,
    filterProducts: true,
    compareProducts: false,
    sideBySideCatalog: false,
    assignProductsToRooms: true,
    editPricing: true,
    viewEstimates: true,
    editEstimates: true,
    generatePDF: true,
    sendProposal: true,
    captureSignature: true,
    rollCutOptimizer: false,
    rollCutVisualization: false,
    installerCutSheets: false,
    multiRoomPlanOverview: false,
    offlineMode: true,
    localFirstSync: true,
    backgroundSync: true,
    conflictResolution: true,
  },
  "android-tablet": {
    freehandDrawing: false,
    assistedDraw: true,
    tapToPlace: true,
    dragWalls: true,
    numericInput: true,
    applePencil: false,
    leiacBluetooth: true,
    walkTheRoom: false,
    rectBySize: true,
    createRooms: true,
    renameRooms: true,
    deleteRooms: true,
    multiRoomView: true,
    multiRoomEdit: false,
    closePolygon: true,
    viewGeometry: true,
    editGeometry: true,
    exportGeometry: true,
    takePhotos: true,
    linkPhotosToWalls: true,
    annotatePhotos: false,
    viewPhotoOverlays: true,
    browseCatalog: true,
    filterProducts: true,
    compareProducts: true,
    sideBySideCatalog: false,
    assignProductsToRooms: true,
    editPricing: true,
    viewEstimates: true,
    editEstimates: true,
    generatePDF: true,
    sendProposal: true,
    captureSignature: true,
    rollCutOptimizer: false,
    rollCutVisualization: false,
    installerCutSheets: false,
    multiRoomPlanOverview: false,
    offlineMode: true,
    localFirstSync: true,
    backgroundSync: true,
    conflictResolution: true,
  },
  unknown: {
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

export const SUPPORTED_DEVICES: SupportedDevice[] = [
  { brand: "Apple", model: "iPad Air (5th gen+)", minOSVersion: "16.0", class: "ipad", supportLevel: "full" },
  { brand: "Apple", model: "iPad Pro (11-inch)", minOSVersion: "16.0", class: "ipad", supportLevel: "full" },
  { brand: "Apple", model: "iPad Pro (12.9-inch)", minOSVersion: "16.0", class: "ipad", supportLevel: "full" },
  { brand: "Apple", model: "iPad (10th gen+)", minOSVersion: "16.0", class: "ipad", supportLevel: "full" },
  { brand: "Apple", model: "iPad mini (6th gen+)", minOSVersion: "16.0", class: "ipad", supportLevel: "full" },
  { brand: "Apple", model: "iPhone 16", minOSVersion: "18.0", class: "iphone", supportLevel: "full" },
  { brand: "Apple", model: "iPhone 16 Plus", minOSVersion: "18.0", class: "iphone", supportLevel: "full" },
  { brand: "Apple", model: "iPhone 16 Pro", minOSVersion: "18.0", class: "iphone", supportLevel: "full" },
  { brand: "Apple", model: "iPhone 16 Pro Max", minOSVersion: "18.0", class: "iphone", supportLevel: "full" },
  { brand: "Apple", model: "iPhone 17*", minOSVersion: "19.0", class: "iphone", supportLevel: "full", note: "Future models" },
  { brand: "Samsung", model: "Galaxy S24", minOSVersion: "14.0", class: "android-phone", supportLevel: "full" },
  { brand: "Samsung", model: "Galaxy S24 Ultra", minOSVersion: "14.0", class: "android-phone", supportLevel: "full" },
  { brand: "Samsung", model: "Galaxy S25*", minOSVersion: "15.0", class: "android-phone", supportLevel: "full", note: "Future" },
  { brand: "Google", model: "Pixel 9", minOSVersion: "14.0", class: "android-phone", supportLevel: "full" },
  { brand: "Google", model: "Pixel 9 Pro", minOSVersion: "14.0", class: "android-phone", supportLevel: "full" },
  { brand: "Google", model: "Pixel 10*", minOSVersion: "15.0", class: "android-phone", supportLevel: "full", note: "Future" },
  { brand: "Samsung", model: "Galaxy Tab S10", minOSVersion: "14.0", class: "android-tablet", supportLevel: "partial" },
  { brand: "Samsung", model: "Galaxy Tab S10 Ultra", minOSVersion: "14.0", class: "android-tablet", supportLevel: "partial" },
];

export function isDeviceSupported(brand: string, model: string, osVersion: string): boolean {
  return SUPPORTED_DEVICES.some((device) => {
    const brandMatch = device.brand.toLowerCase() === brand.toLowerCase();
    const modelMatch = device.model.endsWith("*")
      ? model.toLowerCase().startsWith(device.model.slice(0, -1).toLowerCase())
      : device.model.toLowerCase() === model.toLowerCase();
    const osMatch = parseFloat(osVersion) >= parseFloat(device.minOSVersion);
    return brandMatch && modelMatch && osMatch;
  });
}
