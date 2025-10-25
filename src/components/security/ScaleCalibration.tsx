import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FloorPlan } from "@/lib/securityTypes";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ScaleCalibrationProps {
  floorPlan: FloorPlan | null;
}

export const ScaleCalibration = ({ floorPlan }: ScaleCalibrationProps) => {
  if (!floorPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Scale Calibration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Upload a floor plan to calibrate scale</p>
        </CardContent>
      </Card>
    );
  }

  const isCalibrated = floorPlan.isCalibrated && floorPlan.pixelsPerMeter;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Scale Calibration
          {isCalibrated ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Calibrated
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Not Calibrated
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isCalibrated ? (
          <>
            <div className="text-sm">
              <span className="text-muted-foreground">Scale: </span>
              <span className="font-mono">1m = {floorPlan.pixelsPerMeter?.toFixed(1)} px</span>
            </div>
            {floorPlan.realWorldWidth && (
              <div className="text-sm">
                <span className="text-muted-foreground">Width: </span>
                <span className="font-mono">{floorPlan.realWorldWidth.toFixed(1)}m</span>
              </div>
            )}
            {floorPlan.realWorldHeight && (
              <div className="text-sm">
                <span className="text-muted-foreground">Height: </span>
                <span className="font-mono">{floorPlan.realWorldHeight.toFixed(1)}m</span>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click "Calibrate" tool and mark two points on a known distance
          </p>
        )}
      </CardContent>
    </Card>
  );
};
