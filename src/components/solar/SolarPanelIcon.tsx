import React from 'react';

interface SolarPanelIconProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isActive: boolean;
  isSelected: boolean;
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
  color = "#3B82F6",
}) => {
  const opacity = isActive ? 1 : 0.4;
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill={color}
        opacity={opacity}
        stroke={isSelected ? "#F97316" : "#1E293B"}
        strokeWidth={isSelected ? 3 : 1}
      />
      {/* Grid lines */}
      <line
        x1={-width / 2}
        y1={0}
        x2={width / 2}
        y2={0}
        stroke="#1E293B"
        strokeWidth={0.5}
        opacity={0.5}
      />
      <line
        x1={0}
        y1={-height / 2}
        x2={0}
        y2={height / 2}
        stroke="#1E293B"
        strokeWidth={0.5}
        opacity={0.5}
      />
    </g>
  );
};

export default SolarPanelIcon;
