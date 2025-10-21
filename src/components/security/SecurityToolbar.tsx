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
} from "lucide-react";
import { ToolType } from "@/lib/securityTypes";

interface SecurityToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const SecurityToolbar = ({ activeTool, onToolChange }: SecurityToolbarProps) => {
  const tools = [
    { id: 'select' as ToolType, icon: MousePointer2, label: 'Select' },
    { id: 'camera' as ToolType, icon: Camera, label: 'Camera' },
    { id: 'pir' as ToolType, icon: Waves, label: 'PIR Sensor' },
    { id: 'fan' as ToolType, icon: Fan, label: 'Fan' },
    { id: 'line' as ToolType, icon: Minus, label: 'Line' },
    { id: 'rectangle' as ToolType, icon: Square, label: 'Rectangle' },
    { id: 'circle' as ToolType, icon: Circle, label: 'Circle' },
    { id: 'freehand' as ToolType, icon: Pencil, label: 'Draw' },
    { id: 'eraser' as ToolType, icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
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
};
