import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, Trash2 } from "lucide-react";
import { CameraIcon } from "./CameraIcon";
import { PirIcon } from "./PirIcon";
import { FanIcon } from "./FanIcon";
import {
  Camera,
  PirSensor,
  Fan,
  Drawing,
  FloorPlan,
  ToolType,
  SelectedElement,
  SCALE_FACTOR,
} from "@/lib/securityTypes";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface CanvasAreaProps {
  activeTool: ToolType;
  cameras: Camera[];
  pirs: PirSensor[];
  fans: Fan[];
  drawings: Drawing[];
  floorPlan: FloorPlan | null;
  selected: SelectedElement;
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
  onDrawingDelete: (id: string) => void;
  onFloorPlanUpload: (floorPlan: FloorPlan) => void;
  onSelect: (element: SelectedElement) => void;
  onClearAll: () => void;
}

export const CanvasArea = ({
  activeTool,
  cameras,
  pirs,
  fans,
  drawings,
  floorPlan,
  selected,
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
  onDrawingDelete,
  onFloorPlanUpload,
  onSelect,
  onClearAll,
}: CanvasAreaProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<number[]>([]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'camera') {
      const newCamera: Camera = {
        id: String(cameras.length + 1),
        x,
        y,
        rotation: 0,
        fov: 90,
        range: 30,
      };
      onCameraAdd(newCamera);
      onSelect({ type: 'camera', data: newCamera });
    } else if (activeTool === 'pir') {
      const newPir: PirSensor = {
        id: String(pirs.length + 1),
        x,
        y,
        rotation: 0,
        fov: 110,
        range: 15,
      };
      onPirAdd(newPir);
      onSelect({ type: 'pir', data: newPir });
    } else if (activeTool === 'fan') {
      const newFan: Fan = {
        id: String(fans.length + 1),
        x,
        y,
        rotation: 0,
      };
      onFanAdd(newFan);
      onSelect({ type: 'fan', data: newFan });
    } else if (activeTool === 'eraser') {
      // Check if clicked on any element
      const clickedCamera = cameras.find((cam) => {
        const dx = cam.x - x;
        const dy = cam.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });
      if (clickedCamera) {
        onCameraDelete(clickedCamera.id);
        return;
      }

      const clickedPir = pirs.find((pir) => {
        const dx = pir.x - x;
        const dy = pir.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });
      if (clickedPir) {
        onPirDelete(clickedPir.id);
        return;
      }

      const clickedFan = fans.find((fan) => {
        const dx = fan.x - x;
        const dy = fan.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });
      if (clickedFan) {
        onFanDelete(clickedFan.id);
        return;
      }
    } else if (activeTool === 'select') {
      onSelect(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const scale = 0.5;
        const floorPlanData: FloorPlan = {
          url: event.target?.result as string,
          x: 50,
          y: 50,
          scale,
          width: img.width * scale,
          height: img.height * scale,
        };
        onFloorPlanUpload(floorPlanData);
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

  const showPlaceholder = !floorPlan && cameras.length === 0 && pirs.length === 0 && fans.length === 0 && drawings.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b p-4 flex gap-2 items-center">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Floor Plan
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={onClearAll} className="gap-2">
          <Trash2 className="h-4 w-4" />
          Clear All
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto bg-muted/20"
        onClick={handleCanvasClick}
      >
        {showPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-lg">
              Upload a floor plan or select a template to begin
            </p>
          </div>
        )}

        {floorPlan && (
          <img
            src={floorPlan.url}
            alt="Floor plan"
            style={{
              position: "absolute",
              left: floorPlan.x,
              top: floorPlan.y,
              width: floorPlan.width,
              height: floorPlan.height,
              opacity: 0.7,
              pointerEvents: "none",
            }}
          />
        )}

        <svg className="absolute inset-0 w-full h-full pointer-events-none">
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

          {fans.map((fan) => (
            <FanIcon
              key={fan.id}
              fan={fan}
              isSelected={selected?.type === 'fan' && selected.data.id === fan.id}
              onSelect={() => onSelect({ type: 'fan', data: fan })}
              onMove={(x, y) => onFanUpdate(fan.id, { x, y })}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
