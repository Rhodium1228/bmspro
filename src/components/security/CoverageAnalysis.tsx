import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Camera, CoverageSettings } from '@/lib/securityTypes';
import { calculateCoverageStats } from '@/lib/coverageCalculations';
import { Eye, AlertTriangle, Layers, Target } from 'lucide-react';

interface CoverageAnalysisProps {
  cameras: Camera[];
  coverageSettings: CoverageSettings;
  onCoverageSettingsChange: (settings: CoverageSettings) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export function CoverageAnalysis({
  cameras,
  coverageSettings,
  onCoverageSettingsChange,
  canvasWidth,
  canvasHeight
}: CoverageAnalysisProps) {
  const stats = useMemo(() => {
    if (cameras.length === 0) {
      return { totalCoverage: 0, redundantCoverage: 0, blindSpotCount: 0, averageOverlap: 0 };
    }
    return calculateCoverageStats(cameras, canvasWidth, canvasHeight, 10);
  }, [cameras, canvasWidth, canvasHeight]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Coverage Analysis
        </CardTitle>
        <CardDescription>View and analyze camera coverage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Coverage</div>
            <div className="text-2xl font-bold">{stats.totalCoverage}%</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Redundant</div>
            <div className="text-2xl font-bold">{stats.redundantCoverage}%</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Blind Spots</div>
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats.blindSpotCount}
              {stats.blindSpotCount > 50 && (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Avg Overlap</div>
            <div className="text-2xl font-bold">{stats.averageOverlap.toFixed(1)}x</div>
          </div>
        </div>

        {/* Coverage Legend */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Coverage Zones</Label>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)' }} />
              <span className="text-sm">Red: 0-30m (Identification)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.4)' }} />
              <span className="text-sm">Blue: 30-60m (Detection)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.4)' }} />
              <span className="text-sm">Green: 60-120m (Observation)</span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="show-coverage" className="cursor-pointer">
                Show Coverage Zones
              </Label>
            </div>
            <Switch
              id="show-coverage"
              checked={coverageSettings.showCoverage}
              onCheckedChange={(checked) =>
                onCoverageSettingsChange({ ...coverageSettings, showCoverage: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="show-blindspots" className="cursor-pointer">
                Show Blind Spots
              </Label>
            </div>
            <Switch
              id="show-blindspots"
              checked={coverageSettings.showBlindSpots}
              onCheckedChange={(checked) =>
                onCoverageSettingsChange({ ...coverageSettings, showBlindSpots: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="show-heatmap" className="cursor-pointer">
                Show Heatmap
              </Label>
            </div>
            <Switch
              id="show-heatmap"
              checked={coverageSettings.showHeatmap}
              onCheckedChange={(checked) =>
                onCoverageSettingsChange({ ...coverageSettings, showHeatmap: checked })
              }
              disabled
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
