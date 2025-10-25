// Types for security layout system

export type CameraType = 'bullet' | 'dome' | 'ptz';

export interface Camera {
  id: string;
  x: number;
  y: number;
  rotation: number;
  fov: number; // Field of view in degrees (1-180)
  range: number; // Range in meters (1-120)
  type: CameraType;
}

export interface PirSensor {
  id: string;
  x: number;
  y: number;
  rotation: number;
  range: number; // Range in meters (1-50)
  fov: number; // Field of view in degrees
}

export interface Fan {
  id: string;
  x: number;
  y: number;
  rotation: number;
}

export interface Wall {
  id: string;
  type: 'wall' | 'pillar' | 'obstacle';
  points: number[]; // [x1, y1, x2, y2] for walls, [x, y, width, height] for pillars
  thickness: number; // in pixels, default 10
  height: number; // in meters, affects what it blocks (default 3m)
  color?: string; // visual representation color
}

export interface Drawing {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'freehand';
  points: number[];
  color: string;
  strokeWidth: number;
}

export interface Annotation {
  id: string;
  type: 'text' | 'zone' | 'dimension' | 'arrow';
  x: number;
  y: number;
  x2?: number; // For dimension lines and arrows
  y2?: number;
  text: string;
  color: string;
  fontSize?: number;
  rotation?: number;
}

export interface SecurityZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  securityLevel: 'high' | 'medium' | 'low' | 'critical';
  color: string;
  requiredCameras?: number;
}

export interface LayerSettings {
  background: LayerState;
  cameras: LayerState;
  pirs: LayerState;
  fans: LayerState;
  walls: LayerState;
  annotations: LayerState;
  coverage: LayerState;
}

export interface LayerState {
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface FloorPlan {
  url: string;
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  locked: boolean;
  realWorldWidth?: number; // in meters
  realWorldHeight?: number; // in meters
  pixelsPerMeter?: number; // calculated scale
  isCalibrated?: boolean;
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
}

export interface CoverageSettings {
  showCoverage: boolean;
  showHeatmap: boolean;
  showBlindSpots: boolean;
}

export interface ProjectData {
  cameras: Camera[];
  pirs: PirSensor[];
  fans: Fan[];
  walls: Wall[];
  drawings: Drawing[];
  annotations: Annotation[];
  securityZones: SecurityZone[];
  floorPlan: FloorPlan | null;
  coverageSettings: CoverageSettings;
  layerSettings: LayerSettings;
  pixelsPerMeter?: number; // Global calibration for the entire project
}

export type ToolType = 
  | 'select' 
  | 'camera' 
  | 'pir' 
  | 'fan'
  | 'wall'
  | 'pillar'
  | 'line' 
  | 'rectangle' 
  | 'circle' 
  | 'freehand'
  | 'eraser'
  | 'text'
  | 'zone'
  | 'dimension'
  | 'arrow'
  | 'calibrate';

export type SelectedElement = 
  | { type: 'camera'; data: Camera }
  | { type: 'pir'; data: PirSensor }
  | { type: 'fan'; data: Fan }
  | { type: 'wall'; data: Wall }
  | { type: 'annotation'; data: Annotation }
  | { type: 'zone'; data: SecurityZone }
  | { type: 'drawing'; data: Drawing }
  | null;

// Scale: 1 meter = 10 pixels
export const SCALE_FACTOR = 10;

// Color zones for camera ranges
export const RANGE_COLORS = {
  red: { start: 0, end: 30, color: 'rgba(239, 68, 68, 0.2)' }, // 0-30m
  blue: { start: 30, end: 60, color: 'rgba(59, 130, 246, 0.2)' }, // 30-60m
  green: { start: 60, end: 120, color: 'rgba(34, 197, 94, 0.2)' }, // 60-120m
};
