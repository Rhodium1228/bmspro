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
import { SolarToolType, PanelSpec } from "@/lib/solarTypes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PanelSpecSelector from "./PanelSpecSelector";

interface SolarToolbarProps {
  activeTool: SolarToolType;
  onToolChange: (tool: SolarToolType) => void;
  panelSpecs?: Map<string, PanelSpec>;
  selectedSpecId?: string | null;
  onSelectSpec?: (specId: string) => void;
}

const SolarToolbar = ({ 
  activeTool, 
  onToolChange,
  panelSpecs,
  selectedSpecId,
  onSelectSpec 
}: SolarToolbarProps) => {
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
      <div className="flex flex-col gap-4">
        {/* Panel spec selector */}
        {panelSpecs && selectedSpecId !== undefined && onSelectSpec && (
          <div>
            <label className="text-xs font-medium mb-2 block">Panel Type</label>
            <PanelSpecSelector
              specs={panelSpecs}
              selectedSpecId={selectedSpecId}
              onSelectSpec={onSelectSpec}
            />
          </div>
        )}

        <Separator />

        {/* Tool buttons */}
        <div className="flex flex-col gap-2">
          {tools.map((tool, index) => (
            <React.Fragment key={tool.type}>
              {(index === 3 || index === 4) && <Separator className="my-1" />}
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
                <TooltipContent side="right">
                  <p>{tool.label}</p>
                </TooltipContent>
              </Tooltip>
            </React.Fragment>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SolarToolbar;
