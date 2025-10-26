import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer2, 
  Plus, 
  Grid3x3, 
  Mountain, 
  Type, 
  Ruler, 
  ArrowRight,
  Square
} from "lucide-react";
import { SolarToolType } from "@/lib/solarTypes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SolarToolbarProps {
  activeTool: SolarToolType;
  onToolChange: (tool: SolarToolType) => void;
}

const SolarToolbar = ({ activeTool, onToolChange }: SolarToolbarProps) => {
  const tools = [
    { type: 'select' as SolarToolType, icon: MousePointer2, label: 'Select' },
    { type: 'panel' as SolarToolType, icon: Square, label: 'Add Panel' },
    { type: 'array' as SolarToolType, icon: Grid3x3, label: 'Create Array' },
    { type: 'obstacle' as SolarToolType, icon: Mountain, label: 'Add Obstacle' },
    { type: 'text' as SolarToolType, icon: Type, label: 'Add Text' },
    { type: 'dimension' as SolarToolType, icon: Ruler, label: 'Dimension' },
    { type: 'arrow' as SolarToolType, icon: ArrowRight, label: 'Arrow' },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 bg-background border rounded-lg shadow-sm">
        {tools.map((tool, index) => (
          <React.Fragment key={tool.type}>
            {(index === 3 || index === 4) && <Separator orientation="vertical" className="h-8" />}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.type ? "default" : "ghost"}
                  size="icon"
                  onClick={() => onToolChange(tool.type)}
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default SolarToolbar;
