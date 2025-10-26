import React from 'react';
import { CellConfig } from '@/lib/solarTypes';

interface SolarPanelIconProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isActive: boolean;
  isSelected: boolean;
  cellConfig?: CellConfig;
  color?: string;
}

const SolarPanelIcon: React.FC<SolarPanelIconProps> = ({
  x,
  y,
  width,
  height,
  rotation,
  isActive,
  isSelected,
  cellConfig,
  color = "#3B82F6",
}) => {
  const opacity = isActive ? 1 : 0.4;
  
  // Render individual cells if config provided
  const renderCells = () => {
    if (!cellConfig) return null;
    
    const { rows, cols, type } = cellConfig;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const gap = Math.min(cellWidth, cellHeight) * 0.05;
    
    const cells = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellX = -width / 2 + col * cellWidth + gap;
        const cellY = -height / 2 + row * cellHeight + gap;
        const cellW = cellWidth - gap * 2;
        const cellH = cellHeight - gap * 2;
        
        // Different styles for cell types
        if (type === 'mono' || type === 'mono-hf') {
          // Monocrystalline: solid dark cells with rounded corners
          cells.push(
            <rect
              key={`cell-${row}-${col}`}
              x={cellX}
              y={cellY}
              width={cellW}
              height={cellH}
              fill="#1a1a2e"
              rx={gap}
              opacity={opacity}
            />
          );
        } else if (type === 'poly' || type === 'poly-hf') {
          // Polycrystalline: lighter blue with pattern
          cells.push(
            <rect
              key={`cell-${row}-${col}`}
              x={cellX}
              y={cellY}
              width={cellW}
              height={cellH}
              fill="#2563eb"
              opacity={opacity * 0.8}
            />
          );
        }
      }
    }
    
    // Add center split line for half-cut cells
    if (type === 'mono-hf' || type === 'poly-hf') {
      cells.push(
        <line
          key="hf-split"
          x1={-width / 2}
          y1={0}
          x2={width / 2}
          y2={0}
          stroke="#ffffff"
          strokeWidth={gap * 2}
          opacity={opacity}
        />
      );
    }
    
    return cells;
  };
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      {/* Panel background */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill="#f8f9fa"
        stroke={isSelected ? "#F97316" : "#475569"}
        strokeWidth={isSelected ? 2 : 1}
      />
      
      {/* Render cells or simple fill */}
      {cellConfig ? (
        renderCells()
      ) : (
        <rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          fill={color}
          opacity={opacity}
        />
      )}
      
      {/* Frame */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill="none"
        stroke={isSelected ? "#F97316" : "#1e293b"}
        strokeWidth={isSelected ? 3 : 1.5}
      />
    </g>
  );
};

export default SolarPanelIcon;
