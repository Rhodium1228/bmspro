import { Camera } from "@/lib/securityTypes";
import { SCALE_FACTOR, RANGE_COLORS } from "@/lib/securityTypes";

interface CameraIconProps {
  camera: Camera;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onRotate: (rotation: number) => void;
}

export const CameraIcon = ({
  camera,
  isSelected,
  onSelect,
  onMove,
  onRotate,
}: CameraIconProps) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    e.stopPropagation();
    onSelect();

    const startX = e.clientX;
    const startY = e.clientY;
    const startCamX = camera.x;
    const startCamY = camera.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      onMove(startCamX + dx, startCamY + dy);
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
    onRotate((camera.rotation + delta + 360) % 360);
  };

  // Draw FOV arcs with three color zones
  const drawFovArc = (startRange: number, endRange: number, color: string) => {
    const radiusStart = Math.min(startRange, camera.range) * SCALE_FACTOR;
    const radiusEnd = Math.min(endRange, camera.range) * SCALE_FACTOR;
    
    if (radiusEnd <= radiusStart) return null;

    const angleStart = camera.rotation - camera.fov / 2;
    const angleEnd = camera.rotation + camera.fov / 2;

    const startAngleRad = (angleStart * Math.PI) / 180;
    const endAngleRad = (angleEnd * Math.PI) / 180;

    // Create path for the arc segment
    const x1 = Math.cos(startAngleRad) * radiusStart;
    const y1 = Math.sin(startAngleRad) * radiusStart;
    const x2 = Math.cos(endAngleRad) * radiusStart;
    const y2 = Math.sin(endAngleRad) * radiusStart;
    const x3 = Math.cos(endAngleRad) * radiusEnd;
    const y3 = Math.sin(endAngleRad) * radiusEnd;
    const x4 = Math.cos(startAngleRad) * radiusEnd;
    const y4 = Math.sin(startAngleRad) * radiusEnd;

    const largeArcFlag = camera.fov > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radiusStart} ${radiusStart} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${radiusEnd} ${radiusEnd} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      `Z`,
    ].join(' ');

    return <path d={pathData} fill={color} />;
  };

  return (
    <g
      transform={`translate(${camera.x}, ${camera.y})`}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      className="cursor-move"
    >
      {/* FOV visualization with three color zones */}
      <g opacity={isSelected ? 0.8 : 0.5}>
        {drawFovArc(RANGE_COLORS.red.start, RANGE_COLORS.red.end, RANGE_COLORS.red.color)}
        {drawFovArc(RANGE_COLORS.blue.start, RANGE_COLORS.blue.end, RANGE_COLORS.blue.color)}
        {drawFovArc(RANGE_COLORS.green.start, RANGE_COLORS.green.end, RANGE_COLORS.green.color)}
      </g>

      {/* Camera icon */}
      <g transform={`rotate(${camera.rotation})`}>
        {/* Camera body */}
        <circle
          r="12"
          fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--secondary))"}
          stroke="white"
          strokeWidth="2"
        />
        {/* Camera lens */}
        <circle r="6" fill="white" opacity="0.8" />
        {/* Direction indicator */}
        <path d="M 0,-8 L 4,0 L 0,8 Z" fill="white" transform="translate(8, 0)" />
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

      {/* Camera number badge */}
      <text
        x="20"
        y="5"
        fontSize="12"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
        className="pointer-events-none select-none"
      >
        Cam {camera.id}
      </text>
    </g>
  );
};
