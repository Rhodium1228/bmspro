import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, PirSensor, Fan, FloorPlan, ToolType, SelectedElement, CanvasState, CoverageSettings } from "@/lib/securityTypes";
import { Upload, Download, Trash2 } from "lucide-react";
import { CameraIcon } from "./CameraIcon";
import { PirIcon } from "./PirIcon";
import { FanIcon } from "./FanIcon";
import { CanvasControls } from "./CanvasControls";
import { CoverageVisualization } from "./CoverageVisualization";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

interface CanvasAreaProps {
  activeTool: ToolType;
  cameras: Camera[];
  pirs: PirSensor[];
  fans: Fan[];
  floorPlan: FloorPlan | null;
  selected: SelectedElement;
  coverageSettings: CoverageSettings;
  onCameraAdd: (camera: Camera) => void;
  onCameraUpdate: (id: string, updates: Partial<Camera>) => void;
  onCameraDelete: (id: string) => void;
  onPirAdd: (pir: PirSensor) => void;
  onPirUpdate: (id: string, updates: Partial<PirSensor>) => void;
  onPirDelete: (id: string) => void;
  onFanAdd: (fan: Fan) => void;
  onFanUpdate: (id: string, updates: Partial<Fan>) => void;
  onFanDelete: (id: string) => void;
  onFloorPlanUpload: (floorPlan: FloorPlan) => void;
  onFloorPlanUpdate: (updates: Partial<FloorPlan>) => void;
  onSelect: (element: SelectedElement) => void;
  onClearAll: () => void;
}

export const CanvasArea = ({
  activeTool,
  cameras,
  pirs,
  fans,
  floorPlan,
  selected,
  coverageSettings,
  onCameraAdd,
  onCameraUpdate,
  onCameraDelete,
  onPirAdd,
  onPirUpdate,
  onPirDelete,
  onFanAdd,
  onFanUpdate,
  onFanDelete,
  onFloorPlanUpload,
  onFloorPlanUpdate,
  onSelect,
  onClearAll,
}: CanvasAreaProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: true,
  });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [multiSelectStart, setMultiSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [multiSelectEnd, setMultiSelectEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingFloorPlan, setIsDraggingFloorPlan] = useState(false);
  const [floorPlanDragStart, setFloorPlanDragStart] = useState({ x: 0, y: 0 });

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select' || activeTool === 'eraser') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - canvasState.panX) / canvasState.zoom;
    const y = (e.clientY - rect.top - canvasState.panY) / canvasState.zoom;

    if (activeTool === 'camera') {
      const newCamera: Camera = {
        id: `CAM-${cameras.length + 1}`,
        x,
        y,
        rotation: 0,
        fov: 90,
        range: 30,
        type: 'bullet',
      };
      onCameraAdd(newCamera);
    } else if (activeTool === 'pir') {
      const newPir: PirSensor = {
        id: `PIR-${pirs.length + 1}`,
        x,
        y,
        rotation: 0,
        range: 12,
        fov: 110,
      };
      onPirAdd(newPir);
    } else if (activeTool === 'fan') {
      const newFan: Fan = {
        id: `FAN-${fans.length + 1}`,
        x,
        y,
        rotation: 0,
      };
      onFanAdd(newFan);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.altKey) {
      // Pan mode with Alt key
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasState.panX, y: e.clientY - canvasState.panY });
    } else if (e.button === 0 && activeTool === 'select' && !selected) {
      // Multi-select mode
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - canvasState.panX) / canvasState.zoom;
      const y = (e.clientY - rect.top - canvasState.panY) / canvasState.zoom;
      setMultiSelectStart({ x, y });
      setMultiSelectEnd({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setCanvasState(prev => ({
        ...prev,
        panX: e.clientX - panStart.x,
        panY: e.clientY - panStart.y,
      }));
    } else if (multiSelectStart) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - canvasState.panX) / canvasState.zoom;
      const y = (e.clientY - rect.top - canvasState.panY) / canvasState.zoom;
      setMultiSelectEnd({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (multiSelectStart && multiSelectEnd) {
      // Handle multi-select completion
      // For now, just clear the selection box
      setMultiSelectStart(null);
      setMultiSelectEnd(null);
    }
  };

  const handleFloorPlanMouseDown = (e: React.MouseEvent) => {
    if (!floorPlan || floorPlan.locked || activeTool !== 'select') return;
    e.stopPropagation();
    setIsDraggingFloorPlan(true);
    setFloorPlanDragStart({
      x: e.clientX - floorPlan.x * canvasState.zoom,
      y: e.clientY - floorPlan.y * canvasState.zoom,
    });
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingFloorPlan && floorPlan) {
        const newX = (e.clientX - floorPlanDragStart.x) / canvasState.zoom;
        const newY = (e.clientY - floorPlanDragStart.y) / canvasState.zoom;
        onFloorPlanUpdate({ x: newX, y: newY });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingFloorPlan(false);
    };

    if (isDraggingFloorPlan) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingFloorPlan, floorPlan, floorPlanDragStart, canvasState.zoom, onFloorPlanUpdate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const scale = 0.5;
        const newFloorPlan: FloorPlan = {
          url: event.target?.result as string,
          x: 50,
          y: 50,
          scale,
          width: img.width * scale,
          height: img.height * scale,
          locked: false,
        };
        onFloorPlanUpload(newFloorPlan);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `security-layout-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Success",
        description: "Layout exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export layout",
        variant: "destructive",
      });
    }
  };

  const renderGrid = () => {
    if (!canvasState.showGrid) return null;
    
    const gridSize = 50; // 5 meters (10px per meter)
    const lines = [];
    const width = 2000;
    const height = 2000;

    for (let i = 0; i <= width; i += gridSize) {
      lines.push(
        <line
          key={`v-${i}`}
          x1={i}
          y1={0}
          x2={i}
          y2={height}
          stroke="currentColor"
          strokeWidth={i % (gridSize * 2) === 0 ? 0.5 : 0.25}
          opacity={0.3}
        />
      );
    }

    for (let i = 0; i <= height; i += gridSize) {
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={i}
          x2={width}
          y2={i}
          stroke="currentColor"
          strokeWidth={i % (gridSize * 2) === 0 ? 0.5 : 0.25}
          opacity={0.3}
        />
      );
    }

    return <g className="text-muted-foreground">{lines}</g>;
  };

  return (
    <div className="flex-1 relative bg-muted/30">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
          size="sm"
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Floor Plan
        </Button>
        <Button onClick={handleExport} variant="secondary" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export as Image
        </Button>
        <Button
          onClick={onClearAll}
          variant="destructive"
          size="sm"
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear All
        </Button>
      </div>

      {/* Canvas Controls */}
      <CanvasControls
        zoom={canvasState.zoom}
        showGrid={canvasState.showGrid}
        floorPlanLocked={floorPlan?.locked ?? false}
        onZoomChange={(zoom) => setCanvasState(prev => ({ ...prev, zoom }))}
        onGridToggle={(showGrid) => setCanvasState(prev => ({ ...prev, showGrid }))}
        onFloorPlanLockToggle={(locked) => floorPlan && onFloorPlanUpdate({ locked })}
        onResetView={() => setCanvasState({ zoom: 1, panX: 0, panY: 0, showGrid: canvasState.showGrid })}
      />

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full overflow-hidden"
        style={{ cursor: isPanning ? 'grabbing' : activeTool === 'select' ? 'default' : 'crosshair' }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg 
          className="w-full h-full" 
          viewBox={`${-canvasState.panX / canvasState.zoom} ${-canvasState.panY / canvasState.zoom} ${(canvasRef.current?.clientWidth || 800) / canvasState.zoom} ${(canvasRef.current?.clientHeight || 600) / canvasState.zoom}`}
        >
          {/* Grid */}
          {renderGrid()}

          {/* Floor Plan */}
          {floorPlan && (
            <g>
              <image
                href={floorPlan.url}
                x={floorPlan.x}
                y={floorPlan.y}
                width={floorPlan.width}
                height={floorPlan.height}
                opacity={0.6}
                style={{ cursor: floorPlan.locked ? 'default' : 'move' }}
                onMouseDown={handleFloorPlanMouseDown}
              />
              {!floorPlan.locked && activeTool === 'select' && (
                <rect
                  x={floorPlan.x}
                  y={floorPlan.y}
                  width={floorPlan.width}
                  height={floorPlan.height}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2 / canvasState.zoom}
                  strokeDasharray="8,4"
                  pointerEvents="none"
                />
              )}
            </g>
          )}

          {/* Coverage Visualization */}
          <CoverageVisualization
            cameras={cameras}
            showCoverage={coverageSettings.showCoverage}
            showBlindSpots={coverageSettings.showBlindSpots}
            canvasWidth={2000}
            canvasHeight={1500}
          />

          {/* Cameras */}
          {cameras.map((camera) => (
            <CameraIcon
              key={camera.id}
              camera={camera}
              isSelected={selected?.type === 'camera' && selected.data.id === camera.id}
              onSelect={() => onSelect({ type: 'camera', data: camera })}
              onMove={(x, y) => onCameraUpdate(camera.id, { x, y })}
              onRotate={(rotation) => onCameraUpdate(camera.id, { rotation })}
            />
          ))}

          {/* PIR Sensors */}
          {pirs.map((pir) => (
            <PirIcon
              key={pir.id}
              pir={pir}
              isSelected={selected?.type === 'pir' && selected.data.id === pir.id}
              onSelect={() => onSelect({ type: 'pir', data: pir })}
              onMove={(x, y) => onPirUpdate(pir.id, { x, y })}
              onRotate={(rotation) => onPirUpdate(pir.id, { rotation })}
            />
          ))}

          {/* Fans */}
          {fans.map((fan) => (
            <FanIcon
              key={fan.id}
              fan={fan}
              isSelected={selected?.type === 'fan' && selected.data.id === fan.id}
              onSelect={() => onSelect({ type: 'fan', data: fan })}
              onMove={(x, y) => onFanUpdate(fan.id, { x, y })}
            />
          ))}

          {/* Multi-select box */}
          {multiSelectStart && multiSelectEnd && (
            <rect
              x={Math.min(multiSelectStart.x, multiSelectEnd.x)}
              y={Math.min(multiSelectStart.y, multiSelectEnd.y)}
              width={Math.abs(multiSelectEnd.x - multiSelectStart.x)}
              height={Math.abs(multiSelectEnd.y - multiSelectStart.y)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth={2 / canvasState.zoom}
              strokeDasharray="4,4"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
