import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, ArrowLeft, Download, Upload, FileImage } from "lucide-react";
import { SolarProjectData, SolarPanel, LayerSettings, SolarToolType, SelectedSolarElement, PanelSpec } from "@/lib/solarTypes";
import SolarToolbar from "@/components/solar/SolarToolbar";
import RoofTemplates from "@/components/solar/RoofTemplates";
import SolarAnalysis from "@/components/solar/SolarAnalysis";
import SolarPanelIcon from "@/components/solar/SolarPanelIcon";
import html2canvas from "html2canvas";

const SolarLayout = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projectName, setProjectName] = useState("New Solar Project");
  const [activeTool, setActiveTool] = useState<SolarToolType>('select');
  const [selected, setSelected] = useState<SelectedSolarElement>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [panelSpecs, setPanelSpecs] = useState<Map<string, PanelSpec>>(new Map());
  const [selectedPanelSpec, setSelectedPanelSpec] = useState<string | null>(null);

  const [projectData, setProjectData] = useState<SolarProjectData>({
    panels: [],
    arrays: [],
    obstacles: [],
    annotations: [],
    roofPlan: null,
    layerSettings: {
      background: { visible: true, locked: false, opacity: 100 },
      panels: { visible: true, locked: false, opacity: 100 },
      arrays: { visible: true, locked: false, opacity: 100 },
      obstacles: { visible: true, locked: false, opacity: 100 },
      annotations: { visible: true, locked: false, opacity: 100 },
      shading: { visible: true, locked: false, opacity: 100 },
    },
    pixelsPerMeter: 10,
  });

  // Load panel specs
  useEffect(() => {
    const loadPanelSpecs = async () => {
      const { data, error } = await supabase
        .from("solar_panel_specs")
        .select("*")
        .eq("is_default", true);

      if (error) {
        console.error("Error loading panel specs:", error);
        return;
      }

      if (data) {
        const specsMap = new Map<string, PanelSpec>();
        data.forEach((spec: any) => {
          specsMap.set(spec.id, {
            id: spec.id,
            name: spec.name,
            manufacturer: spec.manufacturer,
            model: spec.model,
            wattage: spec.wattage,
            efficiency: spec.efficiency,
            dimensions_mm: spec.dimensions_mm,
            voltage: spec.voltage,
            current: spec.current,
            datasheet_url: spec.datasheet_url,
            is_default: spec.is_default,
          });
        });
        setPanelSpecs(specsMap);
        
        // Set first spec as default
        if (specsMap.size > 0) {
          setSelectedPanelSpec(Array.from(specsMap.keys())[0]);
        }
      }
    };

    loadPanelSpecs();
  }, []);

  // Load project data
  const { refetch: refetchProject } = useQuery({
    queryKey: ["solar-project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("solar_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      
      if (data) {
        setProjectName(data.name);
        const canvasData = data.canvas_data as any;
        setProjectData({
          panels: canvasData.panels || [],
          arrays: canvasData.arrays || [],
          obstacles: canvasData.obstacles || [],
          annotations: canvasData.annotations || [],
          roofPlan: canvasData.roofPlan || null,
          layerSettings: canvasData.layerSettings || projectData.layerSettings,
          pixelsPerMeter: canvasData.pixelsPerMeter || 10,
          location: canvasData.location,
        });
      }
      
      return data;
    },
    enabled: !!projectId,
  });

  const handleSave = async () => {
    try {
      const session = await supabase.auth.getSession();
      if (!session?.data?.session?.user) {
        toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
        return;
      }

      const userId = session.data.session.user.id;

      // Generate thumbnail
      const canvas = document.getElementById("solar-canvas");
      let exportImageUrl = null;
      
      if (canvas) {
        const canvasElement = await html2canvas(canvas as HTMLElement);
        const blob = await new Promise<Blob>((resolve) => {
          canvasElement.toBlob((b) => resolve(b!), "image/png");
        });

        const fileName = `${userId}/${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("solar-exports")
          .upload(fileName, blob);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("solar-exports")
            .getPublicUrl(fileName);
          exportImageUrl = urlData.publicUrl;
        }
      }

      if (projectId) {
        const { error } = await supabase
          .from("solar_projects")
          .update({
            name: projectName,
            canvas_data: projectData as any,
            export_image_url: exportImageUrl,
          })
          .eq("id", projectId);

        if (error) throw error;
        
        toast({ title: "Success", description: "Project updated successfully" });
      } else {
        const { data, error } = await supabase
          .from("solar_projects")
          .insert([{
            user_id: userId,
            name: projectName,
            canvas_data: projectData as any,
            export_image_url: exportImageUrl,
          }])
          .select()
          .single();

        if (error) throw error;
        
        toast({ title: "Success", description: "Project saved successfully" });
        navigate(`/tools/solar-layout?projectId=${data.id}`);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAddPanel = (x: number, y: number) => {
    if (!selectedPanelSpec) {
      toast({ title: "Error", description: "Please select a panel type first", variant: "destructive" });
      return;
    }

    const spec = panelSpecs.get(selectedPanelSpec);
    if (!spec) return;

    const newPanel: SolarPanel = {
      id: `panel-${Date.now()}`,
      x,
      y,
      rotation: 0,
      orientation: 'portrait',
      panelSpecId: selectedPanelSpec,
      isActive: true,
    };
    
    setProjectData(prev => ({
      ...prev,
      panels: [...prev.panels, newPanel],
    }));
  };

  const handleUploadRoof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const session = await supabase.auth.getSession();
      if (!session?.data?.session?.user) return;

      const userId = session.data.session.user.id;
      const fileName = `${userId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("roof-plans")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("roof-plans")
        .getPublicUrl(fileName);

      const img = new Image();
      img.onload = () => {
        setProjectData(prev => ({
          ...prev,
          roofPlan: {
            url: urlData.publicUrl,
            x: 0,
            y: 0,
            scale: 1,
            width: img.width,
            height: img.height,
            locked: false,
          },
        }));
      };
      img.src = urlData.publicUrl;

      toast({ title: "Success", description: "Roof image uploaded" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSelectTemplate = (template: any) => {
    const img = new Image();
    img.onload = () => {
      setProjectData(prev => ({
        ...prev,
        roofPlan: {
          url: template.image_url,
          x: 0,
          y: 0,
          scale: 1,
          width: img.width,
          height: img.height,
          locked: false,
        },
      }));
    };
    img.src = template.image_url;
    
    setShowTemplates(false);
    toast({ title: "Success", description: "Template loaded" });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/tools/solar-projects")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-lg font-semibold w-64"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <FileImage className="mr-2 h-4 w-4" />
            Templates
          </Button>
          
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Upload Roof
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUploadRoof}
                />
              </span>
            </Button>
          </label>
          
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Project
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <div className="border-r p-4 flex flex-col gap-4">
          <SolarToolbar 
            activeTool={activeTool} 
            onToolChange={setActiveTool}
            panelSpecs={panelSpecs}
            selectedSpecId={selectedPanelSpec}
            onSelectSpec={setSelectedPanelSpec}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto relative bg-muted/20">
          <div
            id="solar-canvas"
            className="w-full h-full flex items-center justify-center"
            style={{ minHeight: '800px' }}
          >
            <svg width="1200" height="800" className="border bg-white">
              {/* Roof background */}
              {projectData.roofPlan && (
                <image
                  href={projectData.roofPlan.url}
                  x={projectData.roofPlan.x}
                  y={projectData.roofPlan.y}
                  width={projectData.roofPlan.width}
                  height={projectData.roofPlan.height}
                  opacity={projectData.layerSettings.background.opacity / 100}
                />
              )}

              {/* Grid */}
              <defs>
                <pattern id="solar-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#solar-grid)" />

              {/* Panels */}
              {projectData.panels.map((panel) => {
                const spec = panelSpecs.get(panel.panelSpecId);
                if (!spec) return null;

                // Calculate dimensions from mm to pixels
                const widthMm = spec.dimensions_mm.width;
                const heightMm = spec.dimensions_mm.height;
                const widthPx = (widthMm / 1000) * (projectData.pixelsPerMeter || 10) * 10;
                const heightPx = (heightMm / 1000) * (projectData.pixelsPerMeter || 10) * 10;

                return (
                  <SolarPanelIcon
                    key={panel.id}
                    x={panel.x}
                    y={panel.y}
                    width={widthPx}
                    height={heightPx}
                    rotation={panel.rotation}
                    isActive={panel.isActive}
                    isSelected={selected?.type === 'panel' && selected.data.id === panel.id}
                    cellConfig={spec.dimensions_mm.cells}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-80 border-l p-4 overflow-auto bg-card">
          <Tabs defaultValue="analysis">
            <TabsList className="w-full">
              <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
              <TabsTrigger value="properties" className="flex-1">Properties</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-4">
              <SolarAnalysis
                panels={projectData.panels}
                panelSpecs={panelSpecs}
                peakSunHours={5}
                electricityRate={0.25}
                installationCost={projectData.panels.length * 1000}
              />
            </TabsContent>

            <TabsContent value="properties" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Project Info</h3>
                  <p className="text-sm text-muted-foreground">
                    Total Panels: {projectData.panels.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Active Panels: {projectData.panels.filter(p => p.isActive).length}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a Roof Template</DialogTitle>
          </DialogHeader>
          <RoofTemplates onSelectTemplate={handleSelectTemplate} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SolarLayout;
