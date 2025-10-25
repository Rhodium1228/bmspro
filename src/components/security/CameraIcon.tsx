import { Camera } from "@/lib/securityTypes";
import { SCALE_FACTOR, RANGE_COLORS } from "@/lib/securityTypes";

interface CameraIconProps {
  camera: Camera;
  isSelected: boolean;
  zoom: number;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onRotate: (rotation: number) => void;
}

export const CameraIcon = ({
  camera,
  isSelected,
  zoom,
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
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
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
            <defs>
              <linearGradient id={`bulletGrad-${camera.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={isSelected ? '#1e40af' : '#1f2937'} />
                <stop offset="50%" stopColor={isSelected ? '#3b82f6' : '#374151'} />
                <stop offset="100%" stopColor={isSelected ? '#1e40af' : '#1f2937'} />
              </linearGradient>
              <radialGradient id={`lensGrad-${camera.id}`}>
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="70%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </radialGradient>
            </defs>
            
            {/* Main body with 3D cylinder effect */}
            <rect
              x={-10}
              y={-8}
              width={24}
              height={16}
              rx={3}
              fill={`url(#bulletGrad-${camera.id})`}
              stroke={isSelected ? '#3b82f6' : '#111827'}
              strokeWidth={1.5}
            />
            
            {/* Sun shield/hood */}
            <path
              d="M 14 -10 L 20 -12 L 20 12 L 14 10 Z"
              fill={isSelected ? '#374151' : '#18181b'}
              stroke={isSelected ? '#2563eb' : '#0f172a'}
              strokeWidth={1}
            />
            
            {/* Lens assembly */}
            <circle
              cx={14}
              cy={0}
              r={8}
              fill="#18181b"
              stroke={isSelected ? '#3b82f6' : '#27272a'}
              strokeWidth={2}
            />
            <circle
              cx={14}
              cy={0}
              r={6}
              fill={`url(#lensGrad-${camera.id})`}
            />
            <circle
              cx={14}
              cy={0}
              r={3}
              fill="#1e3a8a"
              opacity={0.8}
            />
            {/* Lens reflection */}
            <ellipse
              cx={12}
              cy={-2}
              rx={2}
              ry={1.5}
              fill="white"
              opacity={0.4}
            />
            
            {/* IR LED ring */}
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const ledX = 14 + Math.cos(rad) * 9;
              const ledY = Math.sin(rad) * 9;
              return (
                <circle
                  key={angle}
                  cx={ledX}
                  cy={ledY}
                  r={1.5}
                  fill="#dc2626"
                  opacity={0.8}
                />
              );
            })}
            
            {/* Mounting bracket */}
            <rect
              x={-14}
              y={-5}
              width={6}
              height={10}
              rx={1}
              fill={isSelected ? '#2563eb' : '#18181b'}
              stroke={isSelected ? '#1e40af' : '#0f172a'}
              strokeWidth={1}
            />
            <circle cx={-11} cy={0} r={2} fill={isSelected ? '#1e40af' : '#0f172a'} />
            
            {/* Cable gland */}
            <rect
              x={-12}
              y={-2}
              width={3}
              height={4}
              fill={isSelected ? '#1e40af' : '#27272a'}
            />
            
            {/* Direction indicator */}
            <path
              d="M 14 0 L 26 0"
              stroke={isSelected ? '#3b82f6' : '#60a5fa'}
              strokeWidth={2.5}
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      
      case 'dome':
        return (
          <g transform={`rotate(${camera.rotation})`}>
            <defs>
              <radialGradient id={`domeGrad-${camera.id}`}>
                <stop offset="0%" stopColor={isSelected ? '#93c5fd' : '#6b7280'} stopOpacity={0.3} />
                <stop offset="50%" stopColor={isSelected ? '#60a5fa' : '#4b5563'} stopOpacity={0.5} />
                <stop offset="100%" stopColor={isSelected ? '#3b82f6' : '#374151'} stopOpacity={0.7} />
              </radialGradient>
              <radialGradient id={`domeInner-${camera.id}`}>
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </radialGradient>
            </defs>
            
            {/* Mounting base with screw holes */}
            <ellipse
              cx={0}
              cy={4}
              rx={18}
              ry={10}
              fill={isSelected ? '#3b82f6' : '#27272a'}
              stroke={isSelected ? '#2563eb' : '#18181b'}
              strokeWidth={2}
            />
            {/* Screw holes */}
            {[-12, -4, 4, 12].map((x) => (
              <circle
                key={x}
                cx={x}
                cy={4}
                r={1.5}
                fill="#0f172a"
              />
            ))}
            
            {/* Dome bubble - 3D hemisphere */}
            <ellipse
              cx={0}
              cy={-4}
              rx={16}
              ry={14}
              fill={`url(#domeGrad-${camera.id})`}
              stroke={isSelected ? '#3b82f6' : '#52525b'}
              strokeWidth={1.5}
              opacity={0.85}
            />
            
            {/* Inner dark sphere (visible through dome) */}
            <ellipse
              cx={0}
              cy={-2}
              rx={10}
              ry={8}
              fill={`url(#domeInner-${camera.id})`}
              opacity={0.8}
            />
            
            {/* Lens indication */}
            <circle
              cx={0}
              cy={-2}
              r={5}
              fill="#1e3a8a"
              opacity={0.7}
            />
            <circle
              cx={0}
              cy={-2}
              r={3}
              fill="#2563eb"
              opacity={0.6}
            />
            
            {/* Highlight/reflection on dome */}
            <ellipse
              cx={-4}
              cy={-8}
              rx={6}
              ry={4}
              fill="white"
              opacity={0.3}
            />
            
            {/* Direction indicator */}
            <path
              d="M 0 0 L 22 0"
              stroke={isSelected ? '#3b82f6' : '#60a5fa'}
              strokeWidth={2.5}
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      
      case 'ptz':
        return (
          <g transform={`rotate(${camera.rotation})`}>
            <defs>
              <linearGradient id={`ptzGrad-${camera.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={isSelected ? '#1e40af' : '#18181b'} />
                <stop offset="50%" stopColor={isSelected ? '#3b82f6' : '#27272a'} />
                <stop offset="100%" stopColor={isSelected ? '#1e40af' : '#18181b'} />
              </linearGradient>
            </defs>
            
            {/* Main PTZ housing */}
            <rect
              x={-14}
              y={-12}
              width={28}
              height={24}
              rx={4}
              fill={`url(#ptzGrad-${camera.id})`}
              stroke={isSelected ? '#2563eb' : '#0f172a'}
              strokeWidth={2}
            />
            
            {/* Ventilation grills */}
            {[-8, -4, 0, 4, 8].map((y) => (
              <line
                key={y}
                x1={-12}
                y1={y}
                x2={-6}
                y2={y}
                stroke="#0f172a"
                strokeWidth={1}
              />
            ))}
            
            {/* Large PTZ lens */}
            <circle
              cx={16}
              cy={0}
              r={10}
              fill="#0f172a"
              stroke={isSelected ? '#3b82f6' : '#3f3f46'}
              strokeWidth={2.5}
            />
            <circle
              cx={16}
              cy={0}
              r={7}
              fill={`url(#lensGrad-${camera.id})`}
            />
            <circle
              cx={16}
              cy={0}
              r={4}
              fill="#1e3a8a"
            />
            <ellipse
              cx={14}
              cy={-2}
              rx={2.5}
              ry={2}
              fill="white"
              opacity={0.4}
            />
            
            {/* Status LED */}
            <circle
              cx={-10}
              cy={-8}
              r={1.5}
              fill={isSelected ? '#22c55e' : '#dc2626'}
            />
            
            {/* Pan/Tilt joints and arms */}
            <rect
              x={-18}
              y={-6}
              width={6}
              height={12}
              rx={2}
              fill={isSelected ? '#2563eb' : '#18181b'}
              stroke={isSelected ? '#1e40af' : '#0f172a'}
              strokeWidth={1.5}
            />
            <circle
              cx={-15}
              cy={0}
              r={3}
              fill={isSelected ? '#1e40af' : '#0f172a'}
            />
            
            {/* Rotation arc indicators */}
            <path
              d="M -10 -16 Q 0 -18 10 -16"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="none"
              opacity={0.6}
            />
            <path
              d="M -10 16 Q 0 18 10 16"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="none"
              opacity={0.6}
            />
            
            {/* Cable management */}
            <path
              d="M -18 4 Q -20 6 -20 8"
              stroke={isSelected ? '#374151' : '#27272a'}
              strokeWidth={3}
              fill="none"
            />
            
            {/* Direction indicator */}
            <path
              d="M 16 0 L 30 0"
              stroke={isSelected ? '#3b82f6' : '#60a5fa'}
              strokeWidth={3}
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
          r={28}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2.5}
          strokeDasharray="6,4"
        />
      )}

      {/* Camera ID Badge */}
      <g transform="translate(0, -36)">
        <rect
          x={-24}
          y={0}
          width={48}
          height={20}
          rx={4}
          fill={isSelected ? '#3b82f6' : '#1f2937'}
          opacity={0.95}
        />
        <text
          x={0}
          y={13}
          textAnchor="middle"
          fill="white"
          fontSize={11}
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
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>
      </defs>
    </g>
  );
};