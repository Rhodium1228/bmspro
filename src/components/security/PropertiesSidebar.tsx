import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  pixelsPerMeter?: number;
}

export const PropertiesSidebar = ({
  selected,
  onUpdate,
  onDelete,
  pixelsPerMeter = 10,
}: PropertiesSidebarProps) => {
  if (!selected) {
    return (
      <div className="w-full p-6 text-center text-muted-foreground">
        <p>Select an element to view and edit properties</p>
      </div>
    );
  }

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
              <p className="text-xs text-muted-foreground mt-1">
                {(data.range * pixelsPerMeter).toFixed(0)} pixels on canvas
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                {(data.range * pixelsPerMeter).toFixed(0)} pixels on canvas
              </p>
            </div>
          </>
        )}

        {type === 'annotation' && (
          <>
            <div>
              <Label>Text</Label>
              <Input
                value={data.text || ''}
                onChange={(e) => onUpdate({ text: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={data.color || '#3b82f6'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="mt-2 h-10"
              />
            </div>

            {data.type === 'text' && (
              <div>
                <Label>Font Size: {data.fontSize || 16}px</Label>
                <Slider
                  value={[data.fontSize || 16]}
                  onValueChange={([fontSize]) => onUpdate({ fontSize })}
                  min={10}
                  max={48}
                  step={1}
                  className="mt-2"
                />
              </div>
            )}
          </>
        )}

        {type === 'wall' && (
          <>
            <div>
              <Label>Wall Type</Label>
              <Select
                value={data.type}
                onValueChange={(type: 'wall' | 'pillar' | 'obstacle') => onUpdate({ type })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wall">Wall</SelectItem>
                  <SelectItem value="pillar">Pillar</SelectItem>
                  <SelectItem value="obstacle">Obstacle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Thickness: {data.thickness}px</Label>
              <Slider
                value={[data.thickness]}
                onValueChange={([thickness]) => onUpdate({ thickness })}
                min={5}
                max={50}
                step={5}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Height: {data.height}m</Label>
              <Slider
                value={[data.height]}
                onValueChange={([height]) => onUpdate({ height })}
                min={0.5}
                max={10}
                step={0.5}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={data.color || '#64748b'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="mt-2 h-10"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Length</Label>
              <p className="text-sm">
                {data.type === 'wall' && (() => {
                  const [x1, y1, x2, y2] = data.points;
                  const pixelLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                  return (pixelLength / pixelsPerMeter).toFixed(2);
                })()}
                {data.type === 'pillar' && (() => {
                  const [, , width, height] = data.points;
                  return `${(width / pixelsPerMeter).toFixed(1)}m × ${(height / pixelsPerMeter).toFixed(1)}m`;
                })()}
                {data.type === 'obstacle' && 'N/A'}
              </p>
            </div>
          </>
        )}

        {type === 'zone' && (
          <>
            <div>
              <Label>Zone Name</Label>
              <Input
                value={data.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Security Level</Label>
              <Select
                value={data.securityLevel}
                onValueChange={(securityLevel) => onUpdate({ securityLevel })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={data.color || '#f59e0b'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="mt-2 h-10"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Dimensions</Label>
              <p className="text-sm">
                {(data.width / pixelsPerMeter).toFixed(1)}m × {(data.height / pixelsPerMeter).toFixed(1)}m
              </p>
              <p className="text-xs text-muted-foreground">
                Area: {((data.width * data.height) / (pixelsPerMeter * pixelsPerMeter)).toFixed(1)}m²
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
