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

export interface Drawing {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'freehand';
  points: number[];
  color: string;
  strokeWidth: number;
}

export interface FloorPlan {
  url: string;
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  locked: boolean;
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
  drawings: Drawing[];
  floorPlan: FloorPlan | null;
  coverageSettings: CoverageSettings;
}

export type ToolType = 
  | 'select' 
  | 'camera' 
  | 'pir' 
  | 'fan' 
  | 'line' 
  | 'rectangle' 
  | 'circle' 
  | 'freehand'
  | 'eraser';

export type SelectedElement = 
  | { type: 'camera'; data: Camera }
  | { type: 'pir'; data: PirSensor }
  | { type: 'fan'; data: Fan }
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
