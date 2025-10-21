import { useState, useRef } from "react";
import { SecurityToolbar } from "@/components/security/SecurityToolbar";
import { SecurityCanvas } from "@/components/security/SecurityCanvas";
import { PropertiesPanel } from "@/components/security/PropertiesPanel";
import { AIAssistantDialog } from "@/components/security/AIAssistantDialog";
import { TemplateSelector } from "@/components/security/TemplateSelector";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";

export type Tool = 
  | "select" 
  | "camera" 
  | "fan" 
  | "pir" 
  | "line" 
  | "rectangle" 
  | "circle" 
  | "freehand" 
  | "eraser";

export type CanvasObject = {
  id: string;
  type: "camera" | "fan" | "pir" | "line" | "rectangle" | "circle" | "freehand";
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  properties?: any;
  points?: number[];
  width?: number;
  height?: number;
  radius?: number;
  color?: string;
};

const SecurityDesign = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<CanvasObject | null>(null);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled Project");
  const stageRef = useRef<any>(null);

  const handleNewFromTemplate = () => {
    setShowTemplateDialog(true);
  };

  const handleTemplateSelect = async (templateUrl: string, templateName: string) => {
    setFloorPlanUrl(templateUrl);
    setProjectName(templateName);
    setCanvasObjects([]);
    setSelectedObject(null);
    setShowTemplateDialog(false);
    toast({ title: "Template loaded", description: `${templateName} loaded successfully` });
  };

  const handleUploadFloorPlan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast({ title: "Error", description: "You must be logged in to upload files", variant: "destructive" });
      return;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("floor-plans")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("floor-plans").getPublicUrl(fileName);
      setFloorPlanUrl(data.publicUrl);
      toast({ title: "Success", description: "Floor plan uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveProject = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to save", variant: "destructive" });
      return;
    }

    try {
      const projectData = {
        user_id: user.id,
        name: projectName,
        floor_plan_url: floorPlanUrl,
        floor_plan_type: floorPlanUrl ? "upload" : "template",
        canvas_data: { objects: canvasObjects },
      };

      if (currentProjectId) {
        const { error } = await supabase
          .from("security_projects")
          .update(projectData)
          .eq("id", currentProjectId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("security_projects")
          .insert(projectData)
          .select()
          .single();
        if (error) throw error;
        setCurrentProjectId(data.id);
      }

      toast({ title: "Success", description: "Project saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleExportImage = () => {
    if (!stageRef.current) return;

    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = `${projectName}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Success", description: "Image exported successfully" });
  };

  const handleImportProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.canvas_data?.objects) {
        setCanvasObjects(data.canvas_data.objects);
        setFloorPlanUrl(data.floor_plan_url || null);
        setProjectName(data.name || "Imported Project");
        toast({ title: "Success", description: "Project imported successfully" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Invalid project file", variant: "destructive" });
    }
  };

  const handleExportProject = () => {
    const projectData = {
      name: projectName,
      floor_plan_url: floorPlanUrl,
      canvas_data: { objects: canvasObjects },
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${projectName}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Project exported successfully" });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <SecurityToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onNewFromTemplate={handleNewFromTemplate}
        onUploadFloorPlan={handleUploadFloorPlan}
        onImportProject={handleImportProject}
        onExportImage={handleExportImage}
        onExportProject={handleExportProject}
        onSaveProject={handleSaveProject}
        onOpenAI={() => setShowAIDialog(true)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-muted/20">
          <SecurityCanvas
            ref={stageRef}
            activeTool={activeTool}
            canvasObjects={canvasObjects}
            setCanvasObjects={setCanvasObjects}
            selectedObject={selectedObject}
            setSelectedObject={setSelectedObject}
            floorPlanUrl={floorPlanUrl}
          />
        </div>
        
        {selectedObject && (
          <PropertiesPanel
            selectedObject={selectedObject}
            onUpdateObject={(updated) => {
              setCanvasObjects(prev =>
                prev.map(obj => obj.id === updated.id ? updated : obj)
              );
              setSelectedObject(updated);
            }}
            onDeleteObject={() => {
              setCanvasObjects(prev => prev.filter(obj => obj.id !== selectedObject.id));
              setSelectedObject(null);
            }}
          />
        )}
      </div>

      <AIAssistantDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        canvasObjects={canvasObjects}
        onApplySuggestions={(suggestions) => {
          setCanvasObjects(prev => [...prev, ...suggestions]);
        }}
      />

      <TemplateSelector
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
};

export default SecurityDesign;
