import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

interface SecurityToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const SecurityToolbar = ({ activeTool, onToolChange }: SecurityToolbarProps) => {
  const isMobile = useIsMobile();
  
  const deviceTools = [
    { id: 'select' as ToolType, icon: MousePointer2, label: 'Select' },
    { id: 'camera' as ToolType, icon: Camera, label: 'Camera' },
    { id: 'pir' as ToolType, icon: Waves, label: 'PIR Sensor' },
    { id: 'fan' as ToolType, icon: Fan, label: 'Fan' },
  ];

  const structureTools = [
    { id: 'wall' as ToolType, icon: Minus, label: 'Wall' },
    { id: 'pillar' as ToolType, icon: Square, label: 'Pillar' },
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

  const renderToolButton = (tool: typeof deviceTools[0]) => {
    const Icon = tool.icon;
    const button = (
      <Button
        key={tool.id}
        variant={activeTool === tool.id ? "default" : "outline"}
        size="sm"
        onClick={() => onToolChange(tool.id)}
        className={isMobile ? "px-2" : "gap-2"}
      >
        <Icon className="h-4 w-4" />
        {!isMobile && tool.label}
      </Button>
    );

    if (isMobile) {
      return (
        <TooltipProvider key={tool.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  };

  const renderToolGroup = (tools: typeof deviceTools, label: string) => (
    <div className="flex items-center gap-1 sm:gap-2">
      <span className="text-xs text-muted-foreground font-medium hidden md:block">{label}</span>
      {tools.map(renderToolButton)}
    </div>
  );

  if (isMobile) {
    // Mobile: Compact layout with dropdowns
    return (
      <div className="flex gap-1 items-center">
        {/* Always show select tool */}
        {renderToolButton(deviceTools[0])}
        
        {/* Devices dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="px-2">
              <Camera className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Devices</DropdownMenuLabel>
            {deviceTools.slice(1).map((tool) => {
              const Icon = tool.icon;
              return (
                <DropdownMenuItem key={tool.id} onClick={() => onToolChange(tool.id)}>
                  <Icon className="h-4 w-4 mr-2" />
                  {tool.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Drawing dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="px-2">
              <Pencil className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Drawing</DropdownMenuLabel>
            {[...structureTools, ...drawingTools].map((tool) => {
              const Icon = tool.icon;
              return (
                <DropdownMenuItem key={tool.id} onClick={() => onToolChange(tool.id)}>
                  <Icon className="h-4 w-4 mr-2" />
                  {tool.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Annotations dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="px-2">
              <Type className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Annotations</DropdownMenuLabel>
            {annotationTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <DropdownMenuItem key={tool.id} onClick={() => onToolChange(tool.id)}>
                  <Icon className="h-4 w-4 mr-2" />
                  {tool.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Desktop: Full toolbar
  return (
    <div className="flex gap-2 md:gap-4 flex-wrap items-center">
      {renderToolGroup(deviceTools, "Devices")}
      <Separator orientation="vertical" className="h-8 hidden md:block" />
      {renderToolGroup(structureTools, "Structures")}
      <Separator orientation="vertical" className="h-8 hidden md:block" />
      {renderToolGroup(drawingTools, "Drawing")}
      <Separator orientation="vertical" className="h-8 hidden md:block" />
      {renderToolGroup(annotationTools, "Annotations")}
    </div>
  );
};
