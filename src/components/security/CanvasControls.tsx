import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  Hand,
  Lock,
  Unlock,
} from "lucide-react";

interface CanvasControlsProps {
  zoom: number;
  showGrid: boolean;
  floorPlanLocked: boolean;
  onZoomChange: (zoom: number) => void;
  onGridToggle: (show: boolean) => void;
  onFloorPlanLockToggle: (locked: boolean) => void;
  onResetView: () => void;
}

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2];

export const CanvasControls = ({
  zoom,
  showGrid,
  floorPlanLocked,
  onZoomChange,
  onGridToggle,
  onFloorPlanLockToggle,
  onResetView,
}: CanvasControlsProps) => {
  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      onZoomChange(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex > 0) {
      onZoomChange(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-card border rounded-lg shadow-lg p-4 space-y-4 z-10">
      {/* Zoom Controls */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Zoom</Label>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            disabled={zoom === ZOOM_LEVELS[0]}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          {ZOOM_LEVELS.map((level) => (
            <Button
              key={level}
              size="sm"
              variant={zoom === level ? "default" : "ghost"}
              onClick={() => onZoomChange(level)}
              className="text-xs px-2"
            >
              {Math.round(level * 100)}%
            </Button>
          ))}
        </div>
      </div>

      {/* Grid Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4" />
          <Label className="text-sm">Grid</Label>
        </div>
        <Switch checked={showGrid} onCheckedChange={onGridToggle} />
      </div>

      {/* Floor Plan Lock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {floorPlanLocked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Unlock className="h-4 w-4" />
          )}
          <Label className="text-sm">Lock Plan</Label>
        </div>
        <Switch
          checked={floorPlanLocked}
          onCheckedChange={onFloorPlanLockToggle}
        />
      </div>

      {/* Reset View */}
      <Button size="sm" variant="outline" onClick={onResetView} className="w-full gap-2">
        <Maximize2 className="h-4 w-4" />
        Reset View
      </Button>
    </div>
  );
};
