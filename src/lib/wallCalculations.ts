// Wall and obstacle calculation utilities for security layout

import { Wall, Camera } from './securityTypes';

/**
 * Check if a point is blocked by any wall
 */
export function isPointBlockedByWall(
  x: number,
  y: number,
  walls: Wall[]
): boolean {
  for (const wall of walls) {
    if (wall.type === 'pillar') {
      // Pillar is a rectangle
      const [px, py, width, height] = wall.points;
      if (x >= px && x <= px + width && y >= py && y <= py + height) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Line segment intersection check
 */
function lineSegmentsIntersect(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return false;
  
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

/**
 * Check if a line segment intersects with any wall
 */
export function doesLineIntersectWall(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  walls: Wall[]
): boolean {
  for (const wall of walls) {
    if (wall.type === 'wall') {
      const [wx1, wy1, wx2, wy2] = wall.points;
      if (lineSegmentsIntersect(x1, y1, x2, y2, wx1, wy1, wx2, wy2)) {
        return true;
      }
    } else if (wall.type === 'pillar') {
      // Check intersection with pillar edges
      const [px, py, width, height] = wall.points;
      const edges = [
        [px, py, px + width, py],
        [px + width, py, px + width, py + height],
        [px + width, py + height, px, py + height],
        [px, py + height, px, py]
      ];
      
      for (const [ex1, ey1, ex2, ey2] of edges) {
        if (lineSegmentsIntersect(x1, y1, x2, y2, ex1, ey1, ex2, ey2)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Get ray-wall intersection point
 */
export function getRayWallIntersection(
  rayOriginX: number,
  rayOriginY: number,
  rayAngle: number,
  maxRange: number,
  walls: Wall[]
): { x: number; y: number; distance: number } | null {
  const rayEndX = rayOriginX + maxRange * Math.cos(rayAngle);
  const rayEndY = rayOriginY + maxRange * Math.sin(rayAngle);
  
  let closestIntersection: { x: number; y: number; distance: number } | null = null;
  let minDistance = maxRange;
  
  for (const wall of walls) {
    if (wall.type === 'wall') {
      const [wx1, wy1, wx2, wy2] = wall.points;
      const intersection = getLineIntersection(
        rayOriginX, rayOriginY, rayEndX, rayEndY,
        wx1, wy1, wx2, wy2
      );
      
      if (intersection) {
        const distance = Math.sqrt(
          (intersection.x - rayOriginX) ** 2 + (intersection.y - rayOriginY) ** 2
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestIntersection = { ...intersection, distance };
        }
      }
    } else if (wall.type === 'pillar') {
      const [px, py, width, height] = wall.points;
      const edges = [
        [px, py, px + width, py],
        [px + width, py, px + width, py + height],
        [px + width, py + height, px, py + height],
        [px, py + height, px, py]
      ];
      
      for (const [ex1, ey1, ex2, ey2] of edges) {
        const intersection = getLineIntersection(
          rayOriginX, rayOriginY, rayEndX, rayEndY,
          ex1, ey1, ex2, ey2
        );
        
        if (intersection) {
          const distance = Math.sqrt(
            (intersection.x - rayOriginX) ** 2 + (intersection.y - rayOriginY) ** 2
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestIntersection = { ...intersection, distance };
          }
        }
      }
    }
  }
  
  return closestIntersection;
}

/**
 * Get intersection point between two line segments
 */
function getLineIntersection(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): { x: number; y: number } | null {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null;
  
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }
  
  return null;
}

/**
 * Calculate wall length in meters
 */
export function calculateWallLength(wall: Wall, pixelsPerMeter: number): number {
  if (wall.type === 'wall') {
    const [x1, y1, x2, y2] = wall.points;
    const pixelLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return pixelLength / pixelsPerMeter;
  } else if (wall.type === 'pillar') {
    const [, , width, height] = wall.points;
    const perimeter = 2 * (width + height);
    return perimeter / pixelsPerMeter;
  }
  return 0;
}
