import { useMemo } from 'react';
import { Camera } from '@/lib/securityTypes';
import { getCameraCoverageZones, detectBlindSpots, BlindSpot } from '@/lib/coverageCalculations';

interface CoverageVisualizationProps {
  cameras: Camera[];
  showCoverage: boolean;
  showBlindSpots: boolean;
  canvasWidth: number;
  canvasHeight: number;
  pixelsPerMeter?: number;
}

export function CoverageVisualization({
  cameras,
  showCoverage,
  showBlindSpots,
  canvasWidth,
  canvasHeight,
  pixelsPerMeter
}: CoverageVisualizationProps) {
  // Calculate coverage zones for all cameras
  const coverageZones = useMemo(() => {
    if (!showCoverage) return [];
    console.log('🎥 Recalculating coverage zones with pixelsPerMeter:', pixelsPerMeter);
    return cameras.flatMap(camera => {
      console.log(`  Camera ${camera.id}: range=${camera.range}m, pixels=${camera.range * pixelsPerMeter}px`);
      return getCameraCoverageZones(camera, pixelsPerMeter).map(zone => ({
        ...zone,
        cameraId: camera.id
      }));
    });
  }, [cameras, showCoverage, pixelsPerMeter]);

  // Detect blind spots
  const blindSpots: BlindSpot[] = useMemo(() => {
    if (!showBlindSpots || cameras.length === 0) return [];
    return detectBlindSpots(cameras, canvasWidth, canvasHeight, pixelsPerMeter, 20);
  }, [cameras, showBlindSpots, canvasWidth, canvasHeight, pixelsPerMeter]);

  return (
    <g className="coverage-layer">
      {/* Coverage zones */}
      {showCoverage && coverageZones.map((zone, index) => (
        <path
          key={`coverage-${zone.cameraId}-${index}`}
          d={zone.path}
          fill={zone.color}
          stroke="none"
          pointerEvents="none"
        />
      ))}

      {/* Blind spots */}
      {showBlindSpots && blindSpots.map((spot, index) => (
        <g key={`blindspot-${index}`}>
          <rect
            x={spot.x - 10}
            y={spot.y - 10}
            width={20}
            height={20}
            fill="rgba(255, 0, 0, 0.15)"
            stroke="rgba(255, 0, 0, 0.4)"
            strokeWidth={1}
            strokeDasharray="2,2"
            pointerEvents="none"
          />
          {index % 10 === 0 && ( // Show icon for every 10th spot to avoid clutter
            <text
              x={spot.x}
              y={spot.y + 4}
              textAnchor="middle"
              fontSize="12"
              fill="rgba(255, 0, 0, 0.8)"
              pointerEvents="none"
            >
              ⚠
            </text>
          )}
        </g>
      ))}
    </g>
  );
}
