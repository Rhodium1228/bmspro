import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Trash2 } from "lucide-react";
import { SelectedElement, CameraType } from "@/lib/securityTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertiesSidebarProps {
  selected: SelectedElement;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

export const PropertiesSidebar = ({
  selected,
  onUpdate,
  onDelete,
}: PropertiesSidebarProps) => {
  if (!selected) return null;

  const { type, data } = selected;

  return (
    <div className="w-80 border-l bg-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Properties</h3>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground">Type</Label>
          <p className="font-medium capitalize">{type}</p>
        </div>

        {(type === 'camera' || type === 'pir' || type === 'fan') && (
          <>
            <div>
              <Label className="text-sm text-muted-foreground">Position</Label>
              <p className="text-sm">
                X: {Math.round(data.x)}px, Y: {Math.round(data.y)}px
              </p>
            </div>

            <div>
              <Label>Rotation: {data.rotation}°</Label>
              <Slider
                value={[data.rotation]}
                onValueChange={([rotation]) => onUpdate({ rotation })}
                min={0}
                max={360}
                step={1}
                className="mt-2"
              />
            </div>
          </>
        )}

        {type === 'camera' && (
          <>
            <div>
              <Label>Camera Type</Label>
              <Select
                value={data.type}
                onValueChange={(type: CameraType) => onUpdate({ type })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullet">Bullet Camera</SelectItem>
                  <SelectItem value="dome">Dome Camera</SelectItem>
                  <SelectItem value="ptz">PTZ Camera</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Field of View: {data.fov}°</Label>
              <Slider
                value={[data.fov]}
                onValueChange={([fov]) => onUpdate({ fov })}
                min={1}
                max={180}
                step={1}
                className="mt-2"
              />
              <div className="flex gap-2 mt-2">
                {[45, 75, 90, 130, 180].map((preset) => (
                  <Button
                    key={preset}
                    variant={data.fov === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => onUpdate({ fov: preset })}
                  >
                    {preset}°
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Range: {data.range}m</Label>
              <Slider
                value={[data.range]}
                onValueChange={([range]) => onUpdate({ range })}
                min={1}
                max={120}
                step={1}
                className="mt-2"
              />
            </div>
          </>
        )}

        {type === 'pir' && (
          <>
            <div>
              <Label>Field of View: {data.fov}°</Label>
              <Slider
                value={[data.fov]}
                onValueChange={([fov]) => onUpdate({ fov })}
                min={1}
                max={180}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Range: {data.range}m</Label>
              <Slider
                value={[data.range]}
                onValueChange={([range]) => onUpdate({ range })}
                min={1}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
