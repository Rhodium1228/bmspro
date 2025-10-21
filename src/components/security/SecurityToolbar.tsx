import { 
  FilePlus, 
  UploadCloud, 
  Upload, 
  FileImage, 
  MousePointer, 
  Video, 
  Fan, 
  Rss, 
  PenLine, 
  RectangleHorizontal, 
  Circle, 
  Pen, 
  Eraser, 
  BrainCircuit,
  Save,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tool } from "@/pages/SecurityDesign";
import { useRef } from "react";

interface SecurityToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onNewFromTemplate: () => void;
  onUploadFloorPlan: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImportProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportImage: () => void;
  onExportProject: () => void;
  onSaveProject: () => void;
  onOpenAI: () => void;
}

export const SecurityToolbar = ({
  activeTool,
  onToolChange,
  onNewFromTemplate,
  onUploadFloorPlan,
  onImportProject,
  onExportImage,
  onExportProject,
  onSaveProject,
  onOpenAI,
}: SecurityToolbarProps) => {
  const uploadFloorPlanRef = useRef<HTMLInputElement>(null);
  const importProjectRef = useRef<HTMLInputElement>(null);

  const toolButtons = [
    { icon: MousePointer, tool: "select" as Tool, label: "Select Tool" },
    { icon: Video, tool: "camera" as Tool, label: "Place Camera" },
    { icon: Fan, tool: "fan" as Tool, label: "Place Fan" },
    { icon: Rss, tool: "pir" as Tool, label: "Place PIR Sensor" },
    { icon: PenLine, tool: "line" as Tool, label: "Draw Line" },
    { icon: RectangleHorizontal, tool: "rectangle" as Tool, label: "Draw Rectangle" },
    { icon: Circle, tool: "circle" as Tool, label: "Draw Circle" },
    { icon: Pen, tool: "freehand" as Tool, label: "Freehand Tool" },
    { icon: Eraser, tool: "eraser" as Tool, label: "Eraser Tool" },
  ];

  return (
    <div className="border-b bg-card p-2 flex items-center gap-2">
      {/* File Management */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewFromTemplate}
          title="New from Template"
        >
          <FilePlus className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => uploadFloorPlanRef.current?.click()}
          title="Upload Floor Plan"
        >
          <UploadCloud className="h-5 w-5" />
        </Button>
        <input
          ref={uploadFloorPlanRef}
          type="file"
          accept="image/*,.pdf"
          onChange={onUploadFloorPlan}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => importProjectRef.current?.click()}
          title="Import Project"
        >
          <Upload className="h-5 w-5" />
        </Button>
        <input
          ref={importProjectRef}
          type="file"
          accept=".json"
          onChange={onImportProject}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onSaveProject}
          title="Save Project"
        >
          <Save className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onExportProject}
          title="Export Project (JSON)"
        >
          <Download className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onExportImage}
          title="Export as Image"
        >
          <FileImage className="h-5 w-5" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Drawing & Placement Tools */}
      <div className="flex items-center gap-1">
        {toolButtons.map(({ icon: Icon, tool, label }) => (
          <Button
            key={tool}
            variant={activeTool === tool ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onToolChange(tool)}
            title={label}
          >
            <Icon className="h-5 w-5" />
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* AI Assistant */}
      <Button
        variant="outline"
        size="icon"
        onClick={onOpenAI}
        title="AI Security Planner"
        className="ml-auto"
      >
        <BrainCircuit className="h-5 w-5" />
      </Button>
    </div>
  );
};
