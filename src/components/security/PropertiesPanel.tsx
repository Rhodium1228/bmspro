import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Trash2 } from "lucide-react";
import { CanvasObject } from "@/pages/SecurityDesign";

interface PropertiesPanelProps {
  selectedObject: CanvasObject;
  onUpdateObject: (object: CanvasObject) => void;
  onDeleteObject: () => void;
}

export const PropertiesPanel = ({
  selectedObject,
  onUpdateObject,
  onDeleteObject,
}: PropertiesPanelProps) => {
  const handlePropertyChange = (key: string, value: any) => {
    onUpdateObject({
      ...selectedObject,
      properties: {
        ...selectedObject.properties,
        [key]: value,
      },
    });
  };

  const getDeviceLabel = () => {
    switch (selectedObject.type) {
      case "camera": return "CCTV Camera";
      case "fan": return "Fan";
      case "pir": return "PIR Sensor";
      case "line": return "Line";
      case "rectangle": return "Rectangle";
      case "circle": return "Circle";
      case "freehand": return "Freehand Drawing";
      default: return "Object";
    }
  };

  return (
    <Card className="w-80 p-4 space-y-4 overflow-auto border-l">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{getDeviceLabel()}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDeleteObject}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Position X</Label>
          <Input
            type="number"
            value={Math.round(selectedObject.x)}
            onChange={(e) => onUpdateObject({ ...selectedObject, x: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label>Position Y</Label>
          <Input
            type="number"
            value={Math.round(selectedObject.y)}
            onChange={(e) => onUpdateObject({ ...selectedObject, y: Number(e.target.value) })}
          />
        </div>

        {(selectedObject.type === "camera" || selectedObject.type === "fan" || selectedObject.type === "pir") && (
          <>
            <div>
              <Label>Rotation ({selectedObject.rotation || 0}°)</Label>
              <Slider
                value={[selectedObject.rotation || 0]}
                onValueChange={([value]) => onUpdateObject({ ...selectedObject, rotation: value })}
                min={0}
                max={360}
                step={1}
              />
            </div>

            <div>
              <Label>Scale ({((selectedObject.scale || 1) * 100).toFixed(0)}%)</Label>
              <Slider
                value={[(selectedObject.scale || 1) * 100]}
                onValueChange={([value]) => onUpdateObject({ ...selectedObject, scale: value / 100 })}
                min={50}
                max={200}
                step={10}
              />
            </div>

            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={selectedObject.properties?.color || "#3b82f6"}
                onChange={(e) => handlePropertyChange("color", e.target.value)}
              />
            </div>
          </>
        )}

        {selectedObject.type === "camera" && (
          <>
            <div>
              <Label>Coverage Angle (°)</Label>
              <Input
                type="number"
                value={selectedObject.properties?.coverage_angle || 90}
                onChange={(e) => handlePropertyChange("coverage_angle", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Range (m)</Label>
              <Input
                type="number"
                value={selectedObject.properties?.range || 15}
                onChange={(e) => handlePropertyChange("range", Number(e.target.value))}
              />
            </div>
          </>
        )}

        {selectedObject.type === "pir" && (
          <>
            <div>
              <Label>Detection Angle (°)</Label>
              <Input
                type="number"
                value={selectedObject.properties?.detection_angle || 120}
                onChange={(e) => handlePropertyChange("detection_angle", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Range (m)</Label>
              <Input
                type="number"
                value={selectedObject.properties?.range || 10}
                onChange={(e) => handlePropertyChange("range", Number(e.target.value))}
              />
            </div>
          </>
        )}

        {(selectedObject.type === "line" || selectedObject.type === "rectangle" || 
          selectedObject.type === "circle" || selectedObject.type === "freehand") && (
          <div>
            <Label>Color</Label>
            <Input
              type="color"
              value={selectedObject.color || "#000000"}
              onChange={(e) => onUpdateObject({ ...selectedObject, color: e.target.value })}
            />
          </div>
        )}
      </div>
    </Card>
  );
};
