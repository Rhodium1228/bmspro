import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Camera as CameraIcon } from "lucide-react";
import { SelectedElement, CameraType } from "@/lib/securityTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateDORIDistances, DORI_STANDARDS } from "@/lib/doriCalculations";
import { Separator } from "@/components/ui/separator";

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
  // Fetch camera models
  const { data: cameraModels } = useQuery({
    queryKey: ["camera-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("camera_models")
        .select("*")
        .eq("is_active", true)
        .order("brand", { ascending: true })
        .order("model", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  if (!selected) {
    return (
      <div className="w-full p-6 text-center text-muted-foreground">
        <p>Select an element to view and edit properties</p>
      </div>
    );
  }

  const { type, data } = selected;
  
  // Calculate DORI distances for cameras with model specs
  const doriDistances = type === 'camera' && data.resolution_height && data.lens_mm && data.sensor_size
    ? calculateDORIDistances(data.resolution_height, data.lens_mm, data.sensor_size)
    : null;

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
              <Label>Camera Model</Label>
              <Select
                value={data.model_id || "default"}
                onValueChange={(modelId) => {
                  if (modelId === "default") {
                    onUpdate({
                      model_id: undefined,
                      model_brand: undefined,
                      model_name: undefined,
                      resolution_width: undefined,
                      resolution_height: undefined,
                      lens_mm: undefined,
                      sensor_size: undefined,
                      bitrate_kbps: undefined,
                      codec: undefined,
                      fps: undefined,
                      poe_standard: undefined,
                      power_watts: undefined,
                    });
                  } else {
                    const model = cameraModels?.find(m => m.id === modelId);
                    if (model) {
                      onUpdate({
                        model_id: model.id,
                        model_brand: model.brand,
                        model_name: model.model,
                        resolution_width: model.resolution_width,
                        resolution_height: model.resolution_height,
                        lens_mm: model.lens_mm,
                        sensor_size: model.sensor_size,
                        bitrate_kbps: model.bitrate_kbps_default,
                        codec: 'H.265' as const,
                        fps: model.max_fps,
                        poe_standard: model.poe_standard,
                        power_watts: model.power_watts,
                      });
                    }
                  }
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select camera model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (4MP, 2.8mm)</SelectItem>
                  {cameraModels && cameraModels.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      {Array.from(new Set(cameraModels.map(m => m.brand))).map(brand => (
                        <div key={brand}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {brand}
                          </div>
                          {cameraModels
                            .filter(m => m.brand === brand)
                            .map(model => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.model} ({model.resolution_mp}MP, {model.lens_mm}mm)
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {data.model_brand && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CameraIcon className="h-4 w-4" />
                  <span>{data.model_brand} {data.model_name}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Resolution: {data.resolution_width}×{data.resolution_height}</p>
                  <p>Lens: {data.lens_mm}mm | Sensor: {data.sensor_size}</p>
                  {data.bitrate_kbps && <p>Bitrate: {(data.bitrate_kbps / 1024).toFixed(1)} Mbps</p>}
                  {data.poe_standard && <p>Power: {data.poe_standard} ({data.power_watts}W)</p>}
                </div>
              </div>
            )}

            {doriDistances && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">DORI Distances (IEC/EN 62676-4)</Label>
                  <div className="space-y-2">
                    {Object.entries(doriDistances).map(([level, distance]) => {
                      const standard = DORI_STANDARDS[level as keyof typeof DORI_STANDARDS];
                      return (
                        <div 
                          key={level}
                          className="flex items-center justify-between p-2 rounded bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: standard.color }}
                            />
                            <span className="text-sm">{standard.label}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{distance}m</p>
                            <p className="text-xs text-muted-foreground">{standard.ppm} PPM</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Separator />
              </>
            )}

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
