import { LayerSettings } from "@/lib/securityTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayerManagementProps {
  layerSettings: LayerSettings;
  onLayerSettingsChange: (settings: LayerSettings) => void;
}

export const LayerManagement = ({
  layerSettings,
  onLayerSettingsChange,
}: LayerManagementProps) => {
  const layers = [
    { key: 'background' as const, label: '🗺️ Floor Plan', icon: '🗺️' },
    { key: 'cameras' as const, label: '📹 Cameras', icon: '📹' },
    { key: 'pirs' as const, label: '🔴 PIR Sensors', icon: '🔴' },
    { key: 'fans' as const, label: '🌀 Fans', icon: '🌀' },
    { key: 'annotations' as const, label: '📝 Annotations', icon: '📝' },
    { key: 'coverage' as const, label: '🎯 Coverage Zones', icon: '🎯' },
  ];

  const updateLayer = (
    layerKey: keyof LayerSettings,
    updates: Partial<LayerSettings[keyof LayerSettings]>
  ) => {
    onLayerSettingsChange({
      ...layerSettings,
      [layerKey]: { ...layerSettings[layerKey], ...updates },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Layer Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {layers.map(({ key, label }) => {
          const layer = layerSettings[key];
          return (
            <div key={key} className="space-y-2 pb-3 border-b last:border-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{label}</Label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => updateLayer(key, { visible: !layer.visible })}
                  >
                    {layer.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4 opacity-50" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => updateLayer(key, { locked: !layer.locked })}
                  >
                    {layer.locked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4 opacity-50" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Opacity</span>
                  <span className="text-xs font-medium">{layer.opacity}%</span>
                </div>
                <Slider
                  value={[layer.opacity]}
                  onValueChange={([value]) => updateLayer(key, { opacity: value })}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                  disabled={!layer.visible}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};