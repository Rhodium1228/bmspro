// Types for solar panel design system

export type PanelOrientation = 'portrait' | 'landscape';
export type RoofType = 'gable' | 'hip' | 'flat' | 'shed' | 'complex';

export interface SolarPanel {
  id: string;
  x: number;
  y: number;
  rotation: number;
  orientation: PanelOrientation;
  panelSpecId: string;
  arrayId?: string;
  isActive: boolean;
}

export interface PanelArray {
  id: string;
  name: string;
  panelIds: string[];
  tilt: number;
  azimuth: number;
  color: string;
  inverterId?: string;
}

export interface RoofObstacle {
  id: string;
  type: 'chimney' | 'vent' | 'skylight' | 'tree' | 'custom';
  points: number[];
  height: number;
  castsShadow: boolean;
  color?: string;
}

export interface SolarAnnotation {
  id: string;
  type: 'text' | 'dimension' | 'arrow' | 'area-marker';
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  text: string;
  color: string;
  fontSize?: number;
}

export interface RoofPlan {
  url: string;
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  locked: boolean;
  realWorldWidth?: number;
  realWorldHeight?: number;
  pixelsPerMeter?: number;
  pitch?: number;
  azimuth?: number;
  roofType?: RoofType;
}

export interface LayerSettings {
  background: LayerState;
  panels: LayerState;
  arrays: LayerState;
  obstacles: LayerState;
  annotations: LayerState;
  shading: LayerState;
}

export interface LayerState {
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface SolarProjectData {
  panels: SolarPanel[];
  arrays: PanelArray[];
  obstacles: RoofObstacle[];
  annotations: SolarAnnotation[];
  roofPlan: RoofPlan | null;
  layerSettings: LayerSettings;
  pixelsPerMeter?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    peakSunHours?: number;
  };
}

export type SolarToolType = 
  | 'select'
  | 'panel'
  | 'array'
  | 'obstacle'
  | 'text'
  | 'dimension'
  | 'arrow'
  | 'calibrate';

export type SelectedSolarElement =
  | { type: 'panel'; data: SolarPanel }
  | { type: 'array'; data: PanelArray }
  | { type: 'obstacle'; data: RoofObstacle }
  | { type: 'annotation'; data: SolarAnnotation }
  | null;

export const SOLAR_SCALE_FACTOR = 10;
