import { Button } from "@/components/ui/button";
import { Type, Square, Ruler, ArrowRight } from "lucide-react";
import { ToolType } from "@/lib/securityTypes";

interface AnnotationToolsProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const AnnotationTools = ({ activeTool, onToolChange }: AnnotationToolsProps) => {
  const annotationTools = [
    { id: 'text' as ToolType, icon: Type, label: 'Text Label' },
    { id: 'zone' as ToolType, icon: Square, label: 'Zone' },
    { id: 'dimension' as ToolType, icon: Ruler, label: 'Dimension' },
    { id: 'arrow' as ToolType, icon: ArrowRight, label: 'Arrow' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {annotationTools.map((tool) => {
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