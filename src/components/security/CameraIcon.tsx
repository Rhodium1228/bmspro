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
  const drawFovArc = () => {
    const arcs = [];
    
    for (const [key, zone] of Object.entries(RANGE_COLORS)) {
      const radiusStart = Math.min(zone.start, camera.range) * SCALE_FACTOR;
      const radiusEnd = Math.min(zone.end, camera.range) * SCALE_FACTOR;
      
      if (radiusEnd <= radiusStart || radiusStart >= camera.range * SCALE_FACTOR) continue;

      const angleStart = camera.rotation - camera.fov / 2;
      const angleEnd = camera.rotation + camera.fov / 2;

      const startAngleRad = (angleStart * Math.PI) / 180;
      const endAngleRad = (angleEnd * Math.PI) / 180;

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

      arcs.push(<path key={key} d={pathData} fill={zone.color} />);
    }

    return arcs;
  };

  const renderCameraBody = () => {
    switch (camera.type) {
      case 'bullet':
        return (
          <g transform={`rotate(${camera.rotation})`}>
            {/* Bullet camera body */}
            <rect
              x={-8}
              y={-6}
              width={16}
              height={12}
              rx={2}
              fill={isSelected ? '#3b82f6' : '#374151'}
              stroke={isSelected ? '#2563eb' : '#1f2937'}
              strokeWidth={2}
            />
            {/* Lens */}
            <circle
              cx={8}
              cy={0}
              r={5}
              fill="#1f2937"
              stroke="#60a5fa"
              strokeWidth={1.5}
            />
            <circle
              cx={8}
              cy={0}
              r={3}
              fill="#60a5fa"
            />
            {/* Mounting bracket */}
            <rect
              x={-10}
              y={-3}
              width={4}
              height={6}
              fill={isSelected ? '#2563eb' : '#1f2937'}
            />
            {/* Direction indicator */}
            <path
              d="M 8 0 L 20 0"
              stroke="#2563eb"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      
      case 'dome':
        return (
          <g transform={`rotate(${camera.rotation})`}>
            {/* Dome base */}
            <ellipse
              cx={0}
              cy={2}
              rx={14}
              ry={8}
              fill={isSelected ? '#3b82f6' : '#374151'}
              stroke={isSelected ? '#2563eb' : '#1f2937'}
              strokeWidth={2}
            />
            {/* Dome hemisphere */}
            <ellipse
              cx={0}
              cy={-2}
              rx={12}
              ry={10}
              fill={isSelected ? '#60a5fa' : '#4b5563'}
              stroke={isSelected ? '#2563eb' : '#374151'}
              strokeWidth={2}
              opacity={0.7}
            />
            {/* Lens indication */}
            <circle
              cx={0}
              cy={-2}
              r={4}
              fill="#1f2937"
              opacity={0.6}
            />
            {/* Direction indicator */}
            <path
              d="M 0 0 L 18 0"
              stroke="#2563eb"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      
      case 'ptz':
        return (
          <g transform={`rotate(${camera.rotation})`}>
            {/* PTZ body */}
            <rect
              x={-10}
              y={-8}
              width={20}
              height={16}
              rx={3}
              fill={isSelected ? '#3b82f6' : '#374151'}
              stroke={isSelected ? '#2563eb' : '#1f2937'}
              strokeWidth={2}
            />
            {/* Large lens */}
            <circle
              cx={10}
              cy={0}
              r={7}
              fill="#1f2937"
              stroke="#60a5fa"
              strokeWidth={2}
            />
            <circle
              cx={10}
              cy={0}
              r={4}
              fill="#60a5fa"
            />
            {/* Mounting arm */}
            <rect
              x={-12}
              y={-4}
              width={4}
              height={8}
              fill={isSelected ? '#2563eb' : '#1f2937'}
            />
            {/* PTZ rotation indicators */}
            <path
              d="M -8 -12 Q 0 -14 8 -12"
              stroke="#60a5fa"
              strokeWidth={1.5}
              fill="none"
            />
            <path
              d="M -8 12 Q 0 14 8 12"
              stroke="#60a5fa"
              strokeWidth={1.5}
              fill="none"
            />
            {/* Direction indicator */}
            <path
              d="M 10 0 L 22 0"
              stroke="#2563eb"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
    }
  };

  return (
    <g
      transform={`translate(${camera.x}, ${camera.y})`}
      style={{ cursor: 'move' }}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      {/* FOV Visualization */}
      <g>
        {drawFovArc()}
      </g>

      {/* Camera Body */}
      {renderCameraBody()}

      {/* Selection Highlight */}
      {isSelected && (
        <circle
          cx={0}
          cy={0}
          r={22}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4,4"
        />
      )}

      {/* Camera ID Badge */}
      <g transform="translate(0, -28)">
        <rect
          x={-20}
          y={0}
          width={40}
          height={18}
          rx={4}
          fill={isSelected ? '#3b82f6' : '#1f2937'}
          opacity={0.9}
        />
        <text
          x={0}
          y={12}
          textAnchor="middle"
          fill="white"
          fontSize={10}
          fontWeight="bold"
        >
          {camera.id} ({camera.type.toUpperCase()})
        </text>
      </g>

      <defs>
        <marker
          id="arrowhead"
          markerWidth={10}
          markerHeight={7}
          refX={9}
          refY={3.5}
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
        </marker>
      </defs>
    </g>
  );
};
