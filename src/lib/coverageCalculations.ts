// Coverage calculation utilities for security layout

import { Camera, RANGE_COLORS } from './securityTypes';

// Default scale factor (1m = 10px) used when no calibration is available
export const DEFAULT_SCALE_FACTOR = 10;

export interface CoverageZone {
  color: string;
  path: string;
  range: { start: number; end: number };
}

export interface BlindSpot {
  x: number;
  y: number;
  area: number;
}

export interface CoverageStats {
  totalCoverage: number;
  redundantCoverage: number;
  blindSpotCount: number;
  averageOverlap: number;
}

/**
 * Calculate SVG path for camera coverage wedge
 */
export function calculateCameraWedgePath(
  camera: Camera,
  rangeStart: number,
  rangeEnd: number,
  pixelsPerMeter: number = DEFAULT_SCALE_FACTOR
): string {
  const x = camera.x;
  const y = camera.y;
  const rotation = camera.rotation;
  const fov = camera.fov;
  
  // Convert to pixels using calibration
  const innerRadius = rangeStart * pixelsPerMeter;
  const outerRadius = Math.min(rangeEnd, camera.range) * pixelsPerMeter;
  
  if (outerRadius <= innerRadius) return '';
  
  // Calculate angles
  const startAngle = ((rotation - fov / 2) * Math.PI) / 180;
  const endAngle = ((rotation + fov / 2) * Math.PI) / 180;
  
  // Inner arc points
  const innerStart = {
    x: x + innerRadius * Math.cos(startAngle),
    y: y + innerRadius * Math.sin(startAngle)
  };
  const innerEnd = {
    x: x + innerRadius * Math.cos(endAngle),
    y: y + innerRadius * Math.sin(endAngle)
  };
  
  // Outer arc points
  const outerStart = {
    x: x + outerRadius * Math.cos(startAngle),
    y: y + outerRadius * Math.sin(startAngle)
  };
  const outerEnd = {
    x: x + outerRadius * Math.cos(endAngle),
    y: y + outerRadius * Math.sin(endAngle)
  };
  
  // Large arc flag
  const largeArc = fov > 180 ? 1 : 0;
  
  // Build path: outer arc -> line -> inner arc -> close
  return `
    M ${outerStart.x} ${outerStart.y}
    A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
    L ${innerEnd.x} ${innerEnd.y}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
    Z
  `;
}

/**
 * Generate coverage zones for a camera (red, blue, green)
 */
export function getCameraCoverageZones(camera: Camera, pixelsPerMeter: number = DEFAULT_SCALE_FACTOR): CoverageZone[] {
  const zones: CoverageZone[] = [];
  const range = camera.range;
  
  // Red zone (0-30m)
  if (range > RANGE_COLORS.red.start) {
    const path = calculateCameraWedgePath(
      camera,
      RANGE_COLORS.red.start,
      Math.min(range, RANGE_COLORS.red.end),
      pixelsPerMeter
    );
    if (path) {
      zones.push({
        color: RANGE_COLORS.red.color,
        path,
        range: { start: RANGE_COLORS.red.start, end: RANGE_COLORS.red.end }
      });
    }
  }
  
  // Blue zone (30-60m)
  if (range > RANGE_COLORS.blue.start) {
    const path = calculateCameraWedgePath(
      camera,
      RANGE_COLORS.blue.start,
      Math.min(range, RANGE_COLORS.blue.end),
      pixelsPerMeter
    );
    if (path) {
      zones.push({
        color: RANGE_COLORS.blue.color,
        path,
        range: { start: RANGE_COLORS.blue.start, end: RANGE_COLORS.blue.end }
      });
    }
  }
  
  // Green zone (60-120m)
  if (range > RANGE_COLORS.green.start) {
    const path = calculateCameraWedgePath(
      camera,
      RANGE_COLORS.green.start,
      Math.min(range, RANGE_COLORS.green.end),
      pixelsPerMeter
    );
    if (path) {
      zones.push({
        color: RANGE_COLORS.green.color,
        path,
        range: { start: RANGE_COLORS.green.start, end: RANGE_COLORS.green.end }
      });
    }
  }
  
  return zones;
}

/**
 * Calculate coverage statistics
 */
export function calculateCoverageStats(
  cameras: Camera[],
  canvasWidth: number,
  canvasHeight: number,
  pixelsPerMeter: number = DEFAULT_SCALE_FACTOR,
  gridSize: number = 10
): CoverageStats {
  const cols = Math.ceil(canvasWidth / gridSize);
  const rows = Math.ceil(canvasHeight / gridSize);
  
  // Create coverage grid (0 = no coverage, 1+ = number of cameras covering)
  const grid: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));
  
  // Mark covered cells for each camera
  cameras.forEach(camera => {
    const maxRange = camera.range * pixelsPerMeter;
    const fov = camera.fov;
    const rotation = camera.rotation;
    
    // Check each grid cell
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellX = col * gridSize + gridSize / 2;
        const cellY = row * gridSize + gridSize / 2;
        
        // Check if cell is within camera coverage
        const dx = cellX - camera.x;
        const dy = cellY - camera.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= maxRange) {
          // Check if within FOV
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          let cameraNormalized = rotation % 360;
          let angleNormalized = angle % 360;
          
          let diff = angleNormalized - cameraNormalized;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          
          if (Math.abs(diff) <= fov / 2) {
            grid[row][col]++;
          }
        }
      }
    }
  });
  
  // Calculate statistics
  let coveredCells = 0;
  let redundantCells = 0;
  let totalOverlap = 0;
  
  grid.forEach(row => {
    row.forEach(cell => {
      if (cell > 0) {
        coveredCells++;
        if (cell > 1) {
          redundantCells++;
          totalOverlap += cell;
        }
      }
    });
  });
  
  const totalCells = rows * cols;
  const totalCoverage = (coveredCells / totalCells) * 100;
  const redundantCoverage = (redundantCells / totalCells) * 100;
  const averageOverlap = redundantCells > 0 ? totalOverlap / redundantCells : 0;
  const blindSpotCount = totalCells - coveredCells;
  
  return {
    totalCoverage: Math.round(totalCoverage * 10) / 10,
    redundantCoverage: Math.round(redundantCoverage * 10) / 10,
    blindSpotCount,
    averageOverlap: Math.round(averageOverlap * 10) / 10
  };
}

/**
 * Detect blind spots in coverage
 */
export function detectBlindSpots(
  cameras: Camera[],
  canvasWidth: number,
  canvasHeight: number,
  pixelsPerMeter: number = DEFAULT_SCALE_FACTOR,
  gridSize: number = 20
): BlindSpot[] {
  const cols = Math.ceil(canvasWidth / gridSize);
  const rows = Math.ceil(canvasHeight / gridSize);
  const blindSpots: BlindSpot[] = [];
  
  // Create coverage grid
  const grid: boolean[][] = Array(rows).fill(false).map(() => Array(cols).fill(false));
  
  // Mark covered cells
  cameras.forEach(camera => {
    const maxRange = camera.range * pixelsPerMeter;
    const fov = camera.fov;
    const rotation = camera.rotation;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col]) continue; // Already covered
        
        const cellX = col * gridSize + gridSize / 2;
        const cellY = row * gridSize + gridSize / 2;
        
        const dx = cellX - camera.x;
        const dy = cellY - camera.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= maxRange) {
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          let cameraNormalized = rotation % 360;
          let angleNormalized = angle % 360;
          
          let diff = angleNormalized - cameraNormalized;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          
          if (Math.abs(diff) <= fov / 2) {
            grid[row][col] = true;
          }
        }
      }
    }
  });
  
  // Find blind spot clusters
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!grid[row][col]) {
        blindSpots.push({
          x: col * gridSize + gridSize / 2,
          y: row * gridSize + gridSize / 2,
          area: gridSize * gridSize
        });
      }
    }
  }
  
  return blindSpots;
}
