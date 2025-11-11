// DORI Standards Implementation (IEC/EN 62676-4)
// Detection, Observation, Recognition, Identification

export type DORILevel = 'detection' | 'observation' | 'recognition' | 'identification';

export interface DORIDistance {
  level: DORILevel;
  distance: number; // in meters
  ppm: number; // pixels per meter
}

export interface DORIStandard {
  ppm: number;
  label: string;
  color: string;
}

// DORI Standards (IEC/EN 62676-4)
export const DORI_STANDARDS: Record<DORILevel, DORIStandard> = {
  identification: { ppm: 250, label: 'Identification', color: '#EF4444' },
  recognition: { ppm: 125, label: 'Recognition', color: '#F59E0B' },
  observation: { ppm: 63, label: 'Observation', color: '#3B82F6' },
  detection: { ppm: 25, label: 'Detection', color: '#10B981' },
};

/**
 * Get sensor dimensions in mm based on standard sensor designations
 */
export function getSensorDimensions(sensor_size: string): { width: number; height: number } {
  const dimensions: Record<string, { width: number; height: number }> = {
    '1/3"': { width: 4.8, height: 3.6 },
    '1/2.8"': { width: 5.06, height: 3.79 },
    '1/2.7"': { width: 5.37, height: 4.04 },
    '1/2.5"': { width: 5.76, height: 4.29 },
    '1/2"': { width: 6.4, height: 4.8 },
    '1/1.8"': { width: 7.18, height: 5.32 },
    '2/3"': { width: 8.8, height: 6.6 },
    '1"': { width: 12.8, height: 9.6 },
  };
  
  return dimensions[sensor_size] || dimensions['1/3"']; // Default to 1/3"
}

/**
 * Calculate DORI distances for a camera
 * 
 * @param resolution_height - Vertical resolution (pixels)
 * @param lens_mm - Focal length (mm)
 * @param sensor_size - Sensor size designation (e.g., '1/3"')
 * @returns Object with distances for each DORI level
 */
export function calculateDORIDistances(
  resolution_height: number,
  lens_mm: number,
  sensor_size: string
): Record<DORILevel, number> {
  // Target height: 1.75m (average person height)
  const target_height_m = 1.75;
  
  // Get sensor dimensions
  const sensor = getSensorDimensions(sensor_size);
  const sensor_height_mm = sensor.height;
  
  // For each DORI level, calculate max distance
  const distances: Record<DORILevel, number> = {} as Record<DORILevel, number>;
  
  Object.entries(DORI_STANDARDS).forEach(([level, { ppm }]) => {
    // Required pixels on target
    const required_pixels = ppm * target_height_m;
    
    // Distance formula (based on thin lens equation)
    // PPM = (resolution_height / sensor_height_mm) × (lens_mm / distance_m)
    // Solving for distance_m:
    const distance_m = 
      (resolution_height / required_pixels) * 
      (lens_mm / sensor_height_mm) * 
      target_height_m;
    
    distances[level as DORILevel] = Math.round(distance_m * 10) / 10; // Round to 1 decimal
  });
  
  return distances;
}

/**
 * Calculate PPM (Pixels Per Meter) at a given distance
 */
export function calculatePPM(
  distance_m: number,
  resolution_height: number,
  lens_mm: number,
  sensor_size: string
): number {
  const target_height_m = 1.75;
  const sensor = getSensorDimensions(sensor_size);
  const sensor_height_mm = sensor.height;
  
  const ppm = 
    (resolution_height * lens_mm) / 
    (sensor_height_mm * distance_m);
  
  return Math.round(ppm);
}

/**
 * Determine DORI level achieved at a specific distance
 */
export function getDORILevelAtDistance(
  distance_m: number,
  dori_distances: Record<DORILevel, number>
): DORILevel | null {
  if (distance_m <= dori_distances.identification) return 'identification';
  if (distance_m <= dori_distances.recognition) return 'recognition';
  if (distance_m <= dori_distances.observation) return 'observation';
  if (distance_m <= dori_distances.detection) return 'detection';
  return null; // Beyond detection range
}

/**
 * Get all DORI zones for visualization
 */
export function getDORIZones(
  resolution_height: number,
  lens_mm: number,
  sensor_size: string
): DORIDistance[] {
  const distances = calculateDORIDistances(resolution_height, lens_mm, sensor_size);
  
  return [
    {
      level: 'identification',
      distance: distances.identification,
      ppm: DORI_STANDARDS.identification.ppm,
    },
    {
      level: 'recognition',
      distance: distances.recognition,
      ppm: DORI_STANDARDS.recognition.ppm,
    },
    {
      level: 'observation',
      distance: distances.observation,
      ppm: DORI_STANDARDS.observation.ppm,
    },
    {
      level: 'detection',
      distance: distances.detection,
      ppm: DORI_STANDARDS.detection.ppm,
    },
  ];
}
