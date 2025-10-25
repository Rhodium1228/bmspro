import { useState } from "react";
import { SecurityZone } from "@/lib/securityTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ZoneManagerProps {
  zones: SecurityZone[];
  onZonesChange: (zones: SecurityZone[]) => void;
  onZoneSelect?: (zone: SecurityZone) => void;
}

export const ZoneManager = ({ zones, onZonesChange, onZoneSelect }: ZoneManagerProps) => {
  const [editingZone, setEditingZone] = useState<SecurityZone | null>(null);

  const securityLevels = {
    high: { label: 'High Security', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.2)' },
    medium: { label: 'Medium Security', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.2)' },
    low: { label: 'Low Security', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.2)' },
  };

  const calculateRequiredCameras = (zone: SecurityZone) => {
    // Assume 30m range per camera, calculate based on area
    const area = (zone.width / 10) * (zone.height / 10); // Convert pixels to meters
    const cameraCoverage = Math.PI * 30 * 30; // ~2827 sq meters per camera
    return Math.ceil(area / cameraCoverage);
  };

  const addZone = () => {
    const newZone: SecurityZone = {
      id: `ZONE-${zones.length + 1}`,
      name: `Zone ${zones.length + 1}`,
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      securityLevel: 'medium',
      color: securityLevels.medium.color,
    };
    onZonesChange([...zones, newZone]);
  };

  const updateZone = (id: string, updates: Partial<SecurityZone>) => {
    const updatedZones = zones.map((zone) =>
      zone.id === id ? { ...zone, ...updates } : zone
    );
    onZonesChange(updatedZones);
  };

  const deleteZone = (id: string) => {
    onZonesChange(zones.filter((zone) => zone.id !== id));
    if (editingZone?.id === id) setEditingZone(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Security Zones</CardTitle>
          <Button onClick={addZone} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Zone
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {zones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No zones defined. Click "Add Zone" to create one.
          </p>
        ) : (
          zones.map((zone) => (
            <div
              key={zone.id}
              className="p-3 border rounded-lg space-y-2 hover:bg-muted/50 cursor-pointer"
              onClick={() => {
                setEditingZone(zone);
                onZoneSelect?.(zone);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Input
                      value={zone.name}
                      onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                      className="h-7 text-sm font-medium max-w-[150px]"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Badge
                      style={{
                        backgroundColor: securityLevels[zone.securityLevel].bgColor,
                        color: securityLevels[zone.securityLevel].color,
                        borderColor: securityLevels[zone.securityLevel].color,
                      }}
                      className="border"
                    >
                      {securityLevels[zone.securityLevel].label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Area: {((zone.width / 10) * (zone.height / 10)).toFixed(1)}m² • 
                    Est. Cameras: {calculateRequiredCameras(zone)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteZone(zone.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {editingZone?.id === zone.id && (
                <div className="pt-2 space-y-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-1">
                    <Label className="text-xs">Security Level</Label>
                    <Select
                      value={zone.securityLevel}
                      onValueChange={(value) =>
                        updateZone(zone.id, {
                          securityLevel: value as 'high' | 'medium' | 'low',
                          color: securityLevels[value as keyof typeof securityLevels].color,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High Security</SelectItem>
                        <SelectItem value="medium">Medium Security</SelectItem>
                        <SelectItem value="low">Low Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};