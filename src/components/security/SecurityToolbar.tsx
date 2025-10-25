import { Button } from "@/components/ui/button";
import {
  Camera,
  MousePointer2,
  Minus,
  Square,
  Circle,
  Pencil,
  Eraser,
  Fan,
  Waves,
  Type,
  Ruler,
  ArrowRight,
} from "lucide-react";
import { ToolType } from "@/lib/securityTypes";
import { Separator } from "@/components/ui/separator";

interface SecurityToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const SecurityToolbar = ({ activeTool, onToolChange }: SecurityToolbarProps) => {
  const deviceTools = [
    { id: 'select' as ToolType, icon: MousePointer2, label: 'Select' },
    { id: 'camera' as ToolType, icon: Camera, label: 'Camera' },
    { id: 'pir' as ToolType, icon: Waves, label: 'PIR Sensor' },
    { id: 'fan' as ToolType, icon: Fan, label: 'Fan' },
  ];

  const drawingTools = [
    { id: 'line' as ToolType, icon: Minus, label: 'Line' },
    { id: 'rectangle' as ToolType, icon: Square, label: 'Rectangle' },
    { id: 'circle' as ToolType, icon: Circle, label: 'Circle' },
    { id: 'freehand' as ToolType, icon: Pencil, label: 'Draw' },
    { id: 'eraser' as ToolType, icon: Eraser, label: 'Eraser' },
  ];

  const annotationTools = [
    { id: 'text' as ToolType, icon: Type, label: 'Text' },
    { id: 'zone' as ToolType, icon: Square, label: 'Zone' },
    { id: 'dimension' as ToolType, icon: Ruler, label: 'Dimension' },
    { id: 'arrow' as ToolType, icon: ArrowRight, label: 'Arrow' },
    { id: 'calibrate' as ToolType, icon: Ruler, label: 'Calibrate' },
  ];

  const renderToolGroup = (tools: typeof deviceTools, label: string) => (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange(tool.id)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {tool.label}
          </Button>
        );
      })}
    </div>
  );

  return (
    <div className="flex gap-4 flex-wrap items-center">
      {renderToolGroup(deviceTools, "Devices")}
      <Separator orientation="vertical" className="h-8" />
      {renderToolGroup(drawingTools, "Drawing")}
      <Separator orientation="vertical" className="h-8" />
      {renderToolGroup(annotationTools, "Annotations")}
    </div>
  );
};
