import { PirSensor } from "@/lib/securityTypes";
import { SCALE_FACTOR } from "@/lib/securityTypes";

interface PirIconProps {
  pir: PirSensor;
  isSelected: boolean;
  zoom: number;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onRotate: (rotation: number) => void;
}

export const PirIcon = ({
  pir,
  isSelected,
  zoom,
  onSelect,
  onMove,
  onRotate,
}: PirIconProps) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    e.stopPropagation();
    onSelect();

    const startX = e.clientX;
    const startY = e.clientY;
    const startPirX = pir.x;
    const startPirY = pir.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      onMove(startPirX + dx, startPirY + dy);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -5 : 5;
    onRotate((pir.rotation + delta + 360) % 360);
  };

  // Draw detection area
  const radius = pir.range * SCALE_FACTOR;
  const angleStart = pir.rotation - pir.fov / 2;
  const angleEnd = pir.rotation + pir.fov / 2;
  const startAngleRad = (angleStart * Math.PI) / 180;
  const endAngleRad = (angleEnd * Math.PI) / 180;

  const x1 = Math.cos(startAngleRad) * radius;
  const y1 = Math.sin(startAngleRad) * radius;
  const x2 = Math.cos(endAngleRad) * radius;
  const y2 = Math.sin(endAngleRad) * radius;

  const largeArcFlag = pir.fov > 180 ? 1 : 0;

  const pathData = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

  return (
    <g
      transform={`translate(${pir.x}, ${pir.y})`}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      className="cursor-move"
    >
      {/* Detection area */}
      <path
        d={pathData}
        fill="rgba(168, 85, 247, 0.2)"
        stroke="rgba(168, 85, 247, 0.5)"
        strokeWidth="2"
        opacity={isSelected ? 0.8 : 0.5}
      />

      {/* PIR sensor icon */}
      <g transform={`rotate(${pir.rotation})`}>
        {/* Sensor body */}
        <rect
          x="-10"
          y="-10"
          width="20"
          height="20"
          rx="3"
          fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--accent))"}
          stroke="white"
          strokeWidth="2"
        />
        {/* Sensor waves */}
        <path
          d="M -2,-6 Q 0,-3 -2,0 M 0,-6 Q 2,-3 0,0 M 2,-6 Q 4,-3 2,0"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
        />
      </g>

      {/* Selection highlight */}
      {isSelected && (
        <circle
          r="18"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          opacity="0.6"
        />
      )}

      {/* PIR number badge */}
      <text
        x="20"
        y="5"
        fontSize="12"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
        className="pointer-events-none select-none"
      >
        PIR {pir.id}
      </text>
    </g>
  );
};
