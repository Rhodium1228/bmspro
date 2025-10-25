import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, PirSensor, Fan, FloorPlan, ToolType, SelectedElement, CanvasState, CoverageSettings, Annotation, SecurityZone, LayerSettings, Drawing } from "@/lib/securityTypes";
import { Upload, Download, Trash2 } from "lucide-react";
import { CameraIcon } from "./CameraIcon";
import { PirIcon } from "./PirIcon";
import { FanIcon } from "./FanIcon";
import { CanvasControls } from "./CanvasControls";
import { CoverageVisualization } from "./CoverageVisualization";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CanvasAreaProps {
  activeTool: ToolType;
  cameras: Camera[];
  pirs: PirSensor[];
  fans: Fan[];
  drawings: Drawing[];
  annotations: Annotation[];
  securityZones: SecurityZone[];
  floorPlan: FloorPlan | null;
  selected: SelectedElement;
  coverageSettings: CoverageSettings;
  layerSettings: LayerSettings;
  onCameraAdd: (camera: Camera) => void;
  onCameraUpdate: (id: string, updates: Partial<Camera>) => void;
  onCameraDelete: (id: string) => void;
  onPirAdd: (pir: PirSensor) => void;
  onPirUpdate: (id: string, updates: Partial<PirSensor>) => void;
  onPirDelete: (id: string) => void;
  onFanAdd: (fan: Fan) => void;
  onFanUpdate: (id: string, updates: Partial<Fan>) => void;
  onFanDelete: (id: string) => void;
  onDrawingAdd: (drawing: Drawing) => void;
  onAnnotationAdd: (annotation: Annotation) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onZoneAdd: (zone: SecurityZone) => void;
  onZoneUpdate: (id: string, updates: Partial<SecurityZone>) => void;
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
  drawings,
  annotations,
  securityZones,
  floorPlan,
  selected,
  coverageSettings,
  layerSettings,
  onCameraAdd,
  onCameraUpdate,
  onCameraDelete,
  onPirAdd,
  onPirUpdate,
  onPirDelete,
  onFanAdd,
  onFanUpdate,
  onFanDelete,
  onDrawingAdd,
  onAnnotationAdd,
  onAnnotationUpdate,
  onZoneAdd,
  onZoneUpdate,
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
  const [annotationStart, setAnnotationStart] = useState<{ x: number; y: number } | null>(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<Drawing> | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<number[]>([]);
  
  // Calibration state
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationPoint1, setCalibrationPoint1] = useState<{ x: number; y: number } | null>(null);
  const [calibrationPoint2, setCalibrationPoint2] = useState<{ x: number; y: number } | null>(null);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [calibrationDistance, setCalibrationDistance] = useState("");

  // Reset annotation state when tool changes
  useEffect(() => {
    setAnnotationStart(null);
    setIsDrawing(false);
    setDrawingStart(null);
    setCurrentDrawing(null);
    setFreehandPoints([]);
    
    if (activeTool === 'calibrate') {
      setCalibrationMode(true);
      setCalibrationPoint1(null);
      setCalibrationPoint2(null);
    } else {
      setCalibrationMode(false);
    }
  }, [activeTool]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select' || activeTool === 'eraser') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - canvasState.panX) / canvasState.zoom;
    const y = (e.clientY - rect.top - canvasState.panY) / canvasState.zoom;

    // Handle calibration mode
    if (activeTool === 'calibrate') {
      if (!calibrationPoint1) {
        setCalibrationPoint1({ x, y });
        toast({
          title: "Point 1 marked",
          description: "Click second point on a known distance",
        });
      } else {
        setCalibrationPoint2({ x, y });
        setShowCalibrationDialog(true);
      }
      return;
    }

    // Handle line drawing
    if (activeTool === 'line') {
      if (!drawingStart) {
        setDrawingStart({ x, y });
      } else {
        const newDrawing: Drawing = {
          id: `LINE-${Date.now()}`,
          type: 'line',
          points: [drawingStart.x, drawingStart.y, x, y],
          color: '#3b82f6',
          strokeWidth: 2,
        };
        onDrawingAdd(newDrawing);
        setDrawingStart(null);
      }
      return;
    }

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
    } else if (activeTool === 'text') {
      const newAnnotation: Annotation = {
        id: `TEXT-${annotations.length + 1}`,
        type: 'text',
        x,
        y,
        text: 'New Label',
        color: '#3b82f6',
        fontSize: 16,
      };
      onAnnotationAdd(newAnnotation);
    } else if (activeTool === 'zone') {
      if (!annotationStart) {
        setAnnotationStart({ x, y });
      } else {
        const newZone: SecurityZone = {
          id: `ZONE-${securityZones.length + 1}`,
          name: `Zone ${securityZones.length + 1}`,
          x: Math.min(annotationStart.x, x),
          y: Math.min(annotationStart.y, y),
          width: Math.abs(x - annotationStart.x),
          height: Math.abs(y - annotationStart.y),
          securityLevel: 'medium',
          color: '#f59e0b',
        };
        onZoneAdd(newZone);
        setAnnotationStart(null);
      }
    } else if (activeTool === 'dimension' || activeTool === 'arrow') {
      if (!annotationStart) {
        setAnnotationStart({ x, y });
      } else {
        const distance = Math.sqrt(Math.pow(x - annotationStart.x, 2) + Math.pow(y - annotationStart.y, 2));
        const meters = (distance / 10).toFixed(1);
        const newAnnotation: Annotation = {
          id: `${activeTool.toUpperCase()}-${annotations.length + 1}`,
          type: activeTool,
          x: annotationStart.x,
          y: annotationStart.y,
          x2: x,
          y2: y,
          text: activeTool === 'dimension' ? `${meters}m` : '',
          color: '#3b82f6',
        };
        onAnnotationAdd(newAnnotation);
        setAnnotationStart(null);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - canvasState.panX) / canvasState.zoom;
    const y = (e.clientY - rect.top - canvasState.panY) / canvasState.zoom;

    if (e.altKey) {
      // Pan mode with Alt key
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasState.panX, y: e.clientY - canvasState.panY });
    } else if (e.button === 0 && activeTool === 'select' && !selected) {
      // Multi-select mode
      setMultiSelectStart({ x, y });
      setMultiSelectEnd({ x, y });
    } else if (activeTool === 'rectangle' || activeTool === 'circle') {
      setIsDrawing(true);
      setDrawingStart({ x, y });
    } else if (activeTool === 'freehand') {
      setIsDrawing(true);
      setFreehandPoints([x, y]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - canvasState.panX) / canvasState.zoom;
    const y = (e.clientY - rect.top - canvasState.panY) / canvasState.zoom;

    if (isPanning) {
      setCanvasState(prev => ({
        ...prev,
        panX: e.clientX - panStart.x,
        panY: e.clientY - panStart.y,
      }));
    } else if (multiSelectStart) {
      setMultiSelectEnd({ x, y });
    } else if (isDrawing) {
      if (activeTool === 'rectangle' && drawingStart) {
        setCurrentDrawing({
          type: 'rectangle',
          points: [drawingStart.x, drawingStart.y, x - drawingStart.x, y - drawingStart.y],
          color: '#3b82f6',
          strokeWidth: 2,
        });
      } else if (activeTool === 'circle' && drawingStart) {
        const radius = Math.sqrt(Math.pow(x - drawingStart.x, 2) + Math.pow(y - drawingStart.y, 2));
        setCurrentDrawing({
          type: 'circle',
          points: [drawingStart.x, drawingStart.y, radius],
          color: '#3b82f6',
          strokeWidth: 2,
        });
      } else if (activeTool === 'freehand') {
        setFreehandPoints(prev => [...prev, x, y]);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (multiSelectStart && multiSelectEnd) {
      setMultiSelectStart(null);
      setMultiSelectEnd(null);
    }
    
    if (isDrawing) {
      if (activeTool === 'rectangle' && currentDrawing) {
        const newDrawing: Drawing = {
          id: `RECT-${Date.now()}`,
          ...currentDrawing as Omit<Drawing, 'id'>,
        };
        onDrawingAdd(newDrawing);
      } else if (activeTool === 'circle' && currentDrawing) {
        const newDrawing: Drawing = {
          id: `CIRCLE-${Date.now()}`,
          ...currentDrawing as Omit<Drawing, 'id'>,
        };
        onDrawingAdd(newDrawing);
      } else if (activeTool === 'freehand' && freehandPoints.length > 2) {
        const newDrawing: Drawing = {
          id: `FREEHAND-${Date.now()}`,
          type: 'freehand',
          points: freehandPoints,
          color: '#3b82f6',
          strokeWidth: 2,
        };
        onDrawingAdd(newDrawing);
      }
      
      setIsDrawing(false);
      setDrawingStart(null);
      setCurrentDrawing(null);
      setFreehandPoints([]);
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

  const applyCalibration = () => {
    if (!calibrationPoint1 || !calibrationPoint2 || !calibrationDistance || !floorPlan) return;

    const distance = parseFloat(calibrationDistance);
    if (isNaN(distance) || distance <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid distance",
        variant: "destructive",
      });
      return;
    }

    const pixelDistance = Math.sqrt(
      Math.pow(calibrationPoint2.x - calibrationPoint1.x, 2) +
      Math.pow(calibrationPoint2.y - calibrationPoint1.y, 2)
    );

    const pixelsPerMeter = pixelDistance / distance;
    const realWorldWidth = floorPlan.width / pixelsPerMeter;
    const realWorldHeight = floorPlan.height / pixelsPerMeter;

    onFloorPlanUpdate({
      pixelsPerMeter,
      realWorldWidth,
      realWorldHeight,
      isCalibrated: true,
    });

    setShowCalibrationDialog(false);
    setCalibrationPoint1(null);
    setCalibrationPoint2(null);
    setCalibrationDistance("");
    setCalibrationMode(false);

    toast({
      title: "Success",
      description: `Scale calibrated: 1m = ${pixelsPerMeter.toFixed(1)} pixels`,
    });
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
          {floorPlan && layerSettings.background.visible && (
            <g opacity={layerSettings.background.opacity / 100}>
              <image
                href={floorPlan.url}
                x={floorPlan.x}
                y={floorPlan.y}
                width={floorPlan.width}
                height={floorPlan.height}
                style={{ cursor: floorPlan.locked ? 'default' : 'move' }}
                onMouseDown={handleFloorPlanMouseDown}
              />
              {!floorPlan.locked && (
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
          {layerSettings.coverage.visible && (
            <g opacity={layerSettings.coverage.opacity / 100}>
              <CoverageVisualization
                cameras={cameras}
                showCoverage={coverageSettings.showCoverage}
                showBlindSpots={coverageSettings.showBlindSpots}
                canvasWidth={2000}
                canvasHeight={1500}
              />
            </g>
          )}

          {/* Security Zones */}
          {layerSettings.annotations.visible && securityZones.map((zone) => (
            <g key={zone.id} opacity={layerSettings.annotations.opacity / 100}>
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                fill={zone.color}
                fillOpacity={0.15}
                stroke={zone.color}
                strokeWidth={2}
                strokeDasharray="8,4"
              />
              <text
                x={zone.x + zone.width / 2}
                y={zone.y + zone.height / 2}
                textAnchor="middle"
                fill={zone.color}
                fontSize={14}
                fontWeight="bold"
              >
                {zone.name}
              </text>
            </g>
          ))}

          {/* Drawings */}
          {layerSettings.annotations.visible && drawings.map((drawing) => {
            if (drawing.type === 'line') {
              return (
                <line
                  key={drawing.id}
                  x1={drawing.points[0]}
                  y1={drawing.points[1]}
                  x2={drawing.points[2]}
                  y2={drawing.points[3]}
                  stroke={drawing.color}
                  strokeWidth={drawing.strokeWidth}
                  opacity={layerSettings.annotations.opacity / 100}
                />
              );
            } else if (drawing.type === 'rectangle') {
              return (
                <rect
                  key={drawing.id}
                  x={drawing.points[0]}
                  y={drawing.points[1]}
                  width={drawing.points[2]}
                  height={drawing.points[3]}
                  fill="none"
                  stroke={drawing.color}
                  strokeWidth={drawing.strokeWidth}
                  opacity={layerSettings.annotations.opacity / 100}
                />
              );
            } else if (drawing.type === 'circle') {
              return (
                <circle
                  key={drawing.id}
                  cx={drawing.points[0]}
                  cy={drawing.points[1]}
                  r={drawing.points[2]}
                  fill="none"
                  stroke={drawing.color}
                  strokeWidth={drawing.strokeWidth}
                  opacity={layerSettings.annotations.opacity / 100}
                />
              );
            } else if (drawing.type === 'freehand') {
              return (
                <polyline
                  key={drawing.id}
                  points={drawing.points.join(' ')}
                  fill="none"
                  stroke={drawing.color}
                  strokeWidth={drawing.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={layerSettings.annotations.opacity / 100}
                />
              );
            }
            return null;
          })}

          {/* Current drawing preview */}
          {currentDrawing && (
            <>
              {currentDrawing.type === 'rectangle' && (
                <rect
                  x={currentDrawing.points![0]}
                  y={currentDrawing.points![1]}
                  width={currentDrawing.points![2]}
                  height={currentDrawing.points![3]}
                  fill="none"
                  stroke={currentDrawing.color}
                  strokeWidth={currentDrawing.strokeWidth}
                  strokeDasharray="4,4"
                  opacity={0.7}
                />
              )}
              {currentDrawing.type === 'circle' && (
                <circle
                  cx={currentDrawing.points![0]}
                  cy={currentDrawing.points![1]}
                  r={currentDrawing.points![2]}
                  fill="none"
                  stroke={currentDrawing.color}
                  strokeWidth={currentDrawing.strokeWidth}
                  strokeDasharray="4,4"
                  opacity={0.7}
                />
              )}
            </>
          )}

          {/* Freehand drawing preview */}
          {isDrawing && activeTool === 'freehand' && freehandPoints.length > 2 && (
            <polyline
              points={freehandPoints.join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.7}
            />
          )}

          {/* Line drawing preview */}
          {drawingStart && activeTool === 'line' && (
            <circle
              cx={drawingStart.x}
              cy={drawingStart.y}
              r={4}
              fill="#3b82f6"
              opacity={0.7}
            />
          )}

          {/* Calibration markers */}
          {calibrationMode && calibrationPoint1 && (
            <>
              <circle
                cx={calibrationPoint1.x}
                cy={calibrationPoint1.y}
                r={6}
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth={2}
              />
              <text
                x={calibrationPoint1.x}
                y={calibrationPoint1.y - 10}
                fill="#f59e0b"
                fontSize={12}
                fontWeight="bold"
                textAnchor="middle"
              >
                A
              </text>
            </>
          )}
          {calibrationMode && calibrationPoint2 && (
            <>
              <line
                x1={calibrationPoint1!.x}
                y1={calibrationPoint1!.y}
                x2={calibrationPoint2.x}
                y2={calibrationPoint2.y}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4,4"
              />
              <circle
                cx={calibrationPoint2.x}
                cy={calibrationPoint2.y}
                r={6}
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth={2}
              />
              <text
                x={calibrationPoint2.x}
                y={calibrationPoint2.y - 10}
                fill="#f59e0b"
                fontSize={12}
                fontWeight="bold"
                textAnchor="middle"
              >
                B
              </text>
            </>
          )}

          {/* Annotations */}
          {layerSettings.annotations.visible && annotations.map((annotation) => {
            if (annotation.type === 'text') {
              return (
                <text
                  key={annotation.id}
                  x={annotation.x}
                  y={annotation.y}
                  fill={annotation.color}
                  fontSize={annotation.fontSize || 16}
                  fontWeight="bold"
                  opacity={layerSettings.annotations.opacity / 100}
                >
                  {annotation.text}
                </text>
              );
            } else if (annotation.type === 'dimension') {
              return (
                <g key={annotation.id} opacity={layerSettings.annotations.opacity / 100}>
                  <line
                    x1={annotation.x}
                    y1={annotation.y}
                    x2={annotation.x2}
                    y2={annotation.y2}
                    stroke={annotation.color}
                    strokeWidth={2}
                  />
                  <text
                    x={(annotation.x + (annotation.x2 || annotation.x)) / 2}
                    y={(annotation.y + (annotation.y2 || annotation.y)) / 2 - 5}
                    fill={annotation.color}
                    fontSize={12}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {annotation.text}
                  </text>
                </g>
              );
            } else if (annotation.type === 'arrow') {
              return (
                <g key={annotation.id} opacity={layerSettings.annotations.opacity / 100}>
                  <defs>
                    <marker
                      id={`arrow-${annotation.id}`}
                      markerWidth={10}
                      markerHeight={7}
                      refX={9}
                      refY={3.5}
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill={annotation.color} />
                    </marker>
                  </defs>
                  <line
                    x1={annotation.x}
                    y1={annotation.y}
                    x2={annotation.x2}
                    y2={annotation.y2}
                    stroke={annotation.color}
                    strokeWidth={2.5}
                    markerEnd={`url(#arrow-${annotation.id})`}
                  />
                </g>
              );
            }
            return null;
          })}

          {/* Cameras */}
          {layerSettings.cameras.visible && cameras.map((camera) => (
            <g key={camera.id} opacity={layerSettings.cameras.opacity / 100}>
              <CameraIcon
                camera={camera}
                isSelected={selected?.type === 'camera' && selected.data.id === camera.id}
                zoom={canvasState.zoom}
                onSelect={() => onSelect({ type: 'camera', data: camera })}
                onMove={(x, y) => onCameraUpdate(camera.id, { x, y })}
                onRotate={(rotation) => onCameraUpdate(camera.id, { rotation })}
              />
            </g>
          ))}

          {/* PIR Sensors */}
          {layerSettings.pirs.visible && pirs.map((pir) => (
            <g key={pir.id} opacity={layerSettings.pirs.opacity / 100}>
              <PirIcon
                pir={pir}
                isSelected={selected?.type === 'pir' && selected.data.id === pir.id}
                zoom={canvasState.zoom}
                onSelect={() => onSelect({ type: 'pir', data: pir })}
                onMove={(x, y) => onPirUpdate(pir.id, { x, y })}
                onRotate={(rotation) => onPirUpdate(pir.id, { rotation })}
              />
            </g>
          ))}

          {/* Fans */}
          {layerSettings.fans.visible && fans.map((fan) => (
            <g key={fan.id} opacity={layerSettings.fans.opacity / 100}>
              <FanIcon
                fan={fan}
                isSelected={selected?.type === 'fan' && selected.data.id === fan.id}
                zoom={canvasState.zoom}
                onSelect={() => onSelect({ type: 'fan', data: fan })}
                onMove={(x, y) => onFanUpdate(fan.id, { x, y })}
              />
            </g>
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

      {/* Calibration Dialog */}
      <Dialog open={showCalibrationDialog} onOpenChange={setShowCalibrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Real-World Distance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="distance">Distance between marked points (in meters)</Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g., 5.0"
                value={calibrationDistance}
                onChange={(e) => setCalibrationDistance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCalibrationDialog(false);
              setCalibrationPoint1(null);
              setCalibrationPoint2(null);
              setCalibrationDistance("");
            }}>
              Cancel
            </Button>
            <Button onClick={applyCalibration}>Apply Calibration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
