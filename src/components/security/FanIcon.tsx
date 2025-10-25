import { Fan } from "@/lib/securityTypes";

interface FanIconProps {
  fan: Fan;
  isSelected: boolean;
  zoom: number;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}

export const FanIcon = ({
  fan,
  isSelected,
  zoom,
  onSelect,
  onMove,
}: FanIconProps) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    e.stopPropagation();
    onSelect();

    const startX = e.clientX;
    const startY = e.clientY;
    const startFanX = fan.x;
    const startFanY = fan.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      onMove(startFanX + dx, startFanY + dy);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <g
      transform={`translate(${fan.x}, ${fan.y})`}
      onMouseDown={handleMouseDown}
      className="cursor-move"
    >
      {/* Fan blades */}
      <g transform={`rotate(${fan.rotation})`}>
        <circle
          r="15"
          fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted))"}
          stroke="white"
          strokeWidth="2"
        />
        {/* Three blades */}
        {[0, 120, 240].map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy="0"
            rx="12"
            ry="5"
            fill="white"
            opacity="0.8"
            transform={`rotate(${angle})`}
          />
        ))}
        {/* Center hub */}
        <circle r="4" fill="hsl(var(--foreground))" />
      </g>

      {/* Selection highlight */}
      {isSelected && (
        <circle
          r="20"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          opacity="0.6"
        />
      )}

      {/* Fan number badge */}
      <text
        x="20"
        y="5"
        fontSize="12"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
        className="pointer-events-none select-none"
      >
        Fan {fan.id}
      </text>
    </g>
  );
};
