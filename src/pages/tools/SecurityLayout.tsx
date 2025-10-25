import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SecurityToolbar } from "@/components/security/SecurityToolbar";
import { CanvasArea } from "@/components/security/CanvasArea";
import { PropertiesSidebar } from "@/components/security/PropertiesSidebar";
import { CoverageAnalysis } from "@/components/security/CoverageAnalysis";
import { FloorPlanTemplates } from "@/components/security/FloorPlanTemplates";
import { AiPlanner } from "@/components/security/AiPlanner";
import { LayerManagement } from "@/components/security/LayerManagement";
import { ZoneManager } from "@/components/security/ZoneManager";
import { ScaleCalibration } from "@/components/security/ScaleCalibration";
import {
  Camera,
  PirSensor,
  Fan,
  Drawing,
  FloorPlan,
  ToolType,
  SelectedElement,
  ProjectData,
  CoverageSettings,
} from "@/lib/securityTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function SecurityLayout() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projectName, setProjectName] = useState("Untitled Security Layout");
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selected, setSelected] = useState<SelectedElement>(null);
  const [savedLayoutId, setSavedLayoutId] = useState<string | null>(null);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);

  const [projectData, setProjectData] = useState<ProjectData>({
    cameras: [],
    pirs: [],
    fans: [],
    walls: [],
    drawings: [],
    annotations: [],
    securityZones: [],
    floorPlan: null,
    coverageSettings: {
      showCoverage: true,
      showHeatmap: false,
      showBlindSpots: false,
    },
    layerSettings: {
      background: { visible: true, locked: false, opacity: 100 },
      cameras: { visible: true, locked: false, opacity: 100 },
      pirs: { visible: true, locked: false, opacity: 100 },
      fans: { visible: true, locked: false, opacity: 100 },
      walls: { visible: true, locked: false, opacity: 100 },
      annotations: { visible: true, locked: false, opacity: 100 },
      coverage: { visible: true, locked: false, opacity: 100 },
    },
    pixelsPerMeter: 10, // Default calibration
  });

  // Compute pixelsPerMeter from floorPlan or project data
  const pixelsPerMeter = projectData.floorPlan?.pixelsPerMeter || projectData.pixelsPerMeter || 10;

  // Fetch linked quotations
  const { data: linkedQuotations = [], refetch: refetchQuotations } = useQuery({
    queryKey: ["linked-quotations", savedLayoutId],
    queryFn: async () => {
      if (!savedLayoutId) return [];
      const { data, error } = await supabase
        .from("quotations")
        .select("id, quotation_number, customer_name, total, status, is_completed")
        .eq("security_layout_id", savedLayoutId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!savedLayoutId,
  });

  // Load layout from URL param on mount
  useEffect(() => {
    const layoutId = searchParams.get("layoutId");
    if (layoutId && user) {
      loadLayoutFromId(layoutId);
    }
  }, [searchParams, user]);

  const loadLayoutFromId = async (layoutId: string) => {
    setIsLoadingLayout(true);
    try {
      const { data, error } = await supabase
        .from("security_layouts")
        .select("*")
        .eq("id", layoutId)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProjectName(data.name || "Untitled Security Layout");
        setSavedLayoutId(data.id);
        
        const canvasData = data.canvas_data as any;
        if (canvasData) {
          setProjectData({
            cameras: canvasData.cameras || [],
            pirs: canvasData.pirs || [],
            fans: canvasData.fans || [],
            walls: canvasData.walls || [],
            drawings: canvasData.drawings || [],
            annotations: canvasData.annotations || [],
            securityZones: canvasData.securityZones || [],
            floorPlan: canvasData.floorPlan || null,
            coverageSettings: (data.coverage_settings as any as CoverageSettings) || projectData.coverageSettings,
            layerSettings: (data.layer_settings as any) || projectData.layerSettings,
            pixelsPerMeter: canvasData.pixelsPerMeter || projectData.pixelsPerMeter,
          });
        }

        toast({
          title: "Layout loaded",
          description: `Loaded "${data.name}"`,
        });
      }
    } catch (error: any) {
      console.error("Error loading layout:", error);
      toast({
        title: "Error loading layout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingLayout(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.from("security_layouts").insert([{
        user_id: user.id,
        name: projectName,
        canvas_data: projectData as any,
        floor_plan_url: projectData.floorPlan?.url || null,
      }]).select().single();

      if (error) throw error;

      if (data) {
        setSavedLayoutId(data.id);
      }

      toast({
        title: "Success",
        description: "Security layout saved successfully",
      });

      refetchQuotations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save layout",
        variant: "destructive",
      });
    }
  };

  const handleGenerateQuotation = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    // Save the layout first if not already saved
    let layoutId = savedLayoutId;
    
    if (!layoutId) {
      try {
        const { data, error } = await supabase.from("security_layouts").insert([{
          user_id: user.id,
          name: projectName,
          canvas_data: projectData as any,
          floor_plan_url: projectData.floorPlan?.url || null,
        }]).select().single();

        if (error) throw error;
        
        layoutId = data.id;
        setSavedLayoutId(layoutId);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save layout",
          variant: "destructive",
        });
        return;
      }
    }

    // Navigate to quotation page with layout ID
    navigate(`/transactions/quotation?layoutId=${layoutId}`);
    
    toast({
      title: "Success",
      description: "Navigating to quotation page...",
    });
  };

  const updateSelected = (updates: any) => {
    if (!selected) return;

    if (selected.type === 'camera') {
      const updatedCameras = projectData.cameras.map((cam) =>
        cam.id === selected.data.id ? { ...cam, ...updates } : cam
      );
      setProjectData({ ...projectData, cameras: updatedCameras });
      setSelected({ type: 'camera', data: { ...selected.data, ...updates } });
    } else if (selected.type === 'pir') {
      const updatedPirs = projectData.pirs.map((pir) =>
        pir.id === selected.data.id ? { ...pir, ...updates } : pir
      );
      setProjectData({ ...projectData, pirs: updatedPirs });
      setSelected({ type: 'pir', data: { ...selected.data, ...updates } });
    } else if (selected.type === 'fan') {
      const updatedFans = projectData.fans.map((fan) =>
        fan.id === selected.data.id ? { ...fan, ...updates } : fan
      );
      setProjectData({ ...projectData, fans: updatedFans });
      setSelected({ type: 'fan', data: { ...selected.data, ...updates } });
    } else if (selected.type === 'annotation') {
      const updatedAnnotations = projectData.annotations.map((ann) =>
        ann.id === selected.data.id ? { ...ann, ...updates } : ann
      );
      setProjectData({ ...projectData, annotations: updatedAnnotations });
      setSelected({ type: 'annotation', data: { ...selected.data, ...updates } });
    } else if (selected.type === 'zone') {
      const updatedZones = projectData.securityZones.map((zone) =>
        zone.id === selected.data.id ? { ...zone, ...updates } : zone
      );
      setProjectData({ ...projectData, securityZones: updatedZones });
      setSelected({ type: 'zone', data: { ...selected.data, ...updates } });
    } else if (selected.type === 'wall') {
      const updatedWalls = projectData.walls.map((wall) =>
        wall.id === selected.data.id ? { ...wall, ...updates } : wall
      );
      setProjectData({ ...projectData, walls: updatedWalls });
      setSelected({ type: 'wall', data: { ...selected.data, ...updates } });
    }
  };

  const deleteSelected = () => {
    if (!selected) return;

    if (selected.type === 'camera') {
      setProjectData({
        ...projectData,
        cameras: projectData.cameras.filter((cam) => cam.id !== selected.data.id),
      });
    } else if (selected.type === 'pir') {
      setProjectData({
        ...projectData,
        pirs: projectData.pirs.filter((pir) => pir.id !== selected.data.id),
      });
    } else if (selected.type === 'fan') {
      setProjectData({
        ...projectData,
        fans: projectData.fans.filter((fan) => fan.id !== selected.data.id),
      });
    } else if (selected.type === 'annotation') {
      setProjectData({
        ...projectData,
        annotations: projectData.annotations.filter((ann) => ann.id !== selected.data.id),
      });
    } else if (selected.type === 'zone') {
      setProjectData({
        ...projectData,
        securityZones: projectData.securityZones.filter((zone) => zone.id !== selected.data.id),
      });
    } else if (selected.type === 'wall') {
      setProjectData({
        ...projectData,
        walls: projectData.walls.filter((wall) => wall.id !== selected.data.id),
      });
    }

    setSelected(null);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="max-w-md font-semibold text-lg"
          />
          <div className="flex gap-2">
            <FloorPlanTemplates onSelectTemplate={() => {}} />
            <AiPlanner />
            <Button onClick={handleSave} variant="outline" className="gap-2">
              <Save className="h-4 w-4" />
              Save Project
            </Button>
            <Button onClick={handleGenerateQuotation} className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Quotation
            </Button>
          </div>
        </div>

        <SecurityToolbar activeTool={activeTool} onToolChange={setActiveTool} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <CanvasArea
          activeTool={activeTool}
          cameras={projectData.cameras}
          pirs={projectData.pirs}
          fans={projectData.fans}
          walls={projectData.walls}
          drawings={projectData.drawings}
          annotations={projectData.annotations}
          securityZones={projectData.securityZones}
          floorPlan={projectData.floorPlan}
          selected={selected}
          coverageSettings={projectData.coverageSettings}
          layerSettings={projectData.layerSettings}
          onCameraAdd={(camera) => {
            setProjectData({ ...projectData, cameras: [...projectData.cameras, camera] });
            setActiveTool('select');
          }}
          onCameraUpdate={(id, updates) => {
            const updatedCameras = projectData.cameras.map((cam) =>
              cam.id === id ? { ...cam, ...updates } : cam
            );
            setProjectData({ ...projectData, cameras: updatedCameras });
          }}
          onCameraDelete={(id) => {
            setProjectData({
              ...projectData,
              cameras: projectData.cameras.filter((cam) => cam.id !== id),
            });
          }}
          onPirAdd={(pir) => {
            setProjectData({ ...projectData, pirs: [...projectData.pirs, pir] });
            setActiveTool('select');
          }}
          onPirUpdate={(id, updates) => {
            const updatedPirs = projectData.pirs.map((pir) =>
              pir.id === id ? { ...pir, ...updates } : pir
            );
            setProjectData({ ...projectData, pirs: updatedPirs });
          }}
          onPirDelete={(id) => {
            setProjectData({
              ...projectData,
              pirs: projectData.pirs.filter((pir) => pir.id !== id),
            });
          }}
          onFanAdd={(fan) => {
            setProjectData({ ...projectData, fans: [...projectData.fans, fan] });
            setActiveTool('select');
          }}
          onFanUpdate={(id, updates) => {
            const updatedFans = projectData.fans.map((fan) =>
              fan.id === id ? { ...fan, ...updates } : fan
            );
            setProjectData({ ...projectData, fans: updatedFans });
          }}
          onFanDelete={(id) => {
            setProjectData({
              ...projectData,
              fans: projectData.fans.filter((fan) => fan.id !== id),
            });
          }}
          onDrawingAdd={(drawing) => {
            setProjectData({ ...projectData, drawings: [...projectData.drawings, drawing] });
          }}
          onAnnotationAdd={(annotation) => {
            setProjectData({ ...projectData, annotations: [...projectData.annotations, annotation] });
            setActiveTool('select');
          }}
          onAnnotationUpdate={(id, updates) => {
            const updatedAnnotations = projectData.annotations.map((ann) =>
              ann.id === id ? { ...ann, ...updates } : ann
            );
            setProjectData({ ...projectData, annotations: updatedAnnotations });
          }}
          onZoneAdd={(zone) => {
            setProjectData({ ...projectData, securityZones: [...projectData.securityZones, zone] });
            setActiveTool('select');
          }}
          onZoneUpdate={(id, updates) => {
            const updatedZones = projectData.securityZones.map((zone) =>
              zone.id === id ? { ...zone, ...updates } : zone
            );
            setProjectData({ ...projectData, securityZones: updatedZones });
          }}
          onWallAdd={(wall) => {
            setProjectData({ ...projectData, walls: [...projectData.walls, wall] });
            setActiveTool('select');
          }}
          onWallUpdate={(id, updates) => {
            const updatedWalls = projectData.walls.map((wall) =>
              wall.id === id ? { ...wall, ...updates } : wall
            );
            setProjectData({ ...projectData, walls: updatedWalls });
          }}
          onWallDelete={(id) => {
            setProjectData({
              ...projectData,
              walls: projectData.walls.filter((wall) => wall.id !== id),
            });
          }}
          onFloorPlanUpload={(floorPlan) => {
            setProjectData({ ...projectData, floorPlan });
          }}
          onFloorPlanUpdate={(updates) => {
            if (projectData.floorPlan) {
              const updatedFloorPlan = { ...projectData.floorPlan, ...updates };
              setProjectData({
                ...projectData,
                floorPlan: updatedFloorPlan,
                // Sync global pixelsPerMeter when floor plan is calibrated
                pixelsPerMeter: updatedFloorPlan.pixelsPerMeter || projectData.pixelsPerMeter,
              });
            }
          }}
          pixelsPerMeter={pixelsPerMeter}
          onSelect={setSelected}
          onClearAll={() => {
            setProjectData({
              cameras: [],
              pirs: [],
              fans: [],
              walls: [],
              drawings: [],
              annotations: [],
              securityZones: [],
              floorPlan: null,
              coverageSettings: {
                showCoverage: true,
                showHeatmap: false,
                showBlindSpots: false,
              },
              layerSettings: {
                background: { visible: true, locked: false, opacity: 100 },
                cameras: { visible: true, locked: false, opacity: 100 },
                pirs: { visible: true, locked: false, opacity: 100 },
                fans: { visible: true, locked: false, opacity: 100 },
                walls: { visible: true, locked: false, opacity: 100 },
                annotations: { visible: true, locked: false, opacity: 100 },
                coverage: { visible: true, locked: false, opacity: 100 },
              },
            });
            setSelected(null);
          }}
        />

        <div className="w-80 border-l overflow-y-auto">
          <Tabs defaultValue="coverage" className="w-full">
            <TabsList className="w-full grid grid-cols-5 text-xs">
              <TabsTrigger value="coverage">Cover</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="zones">Zones</TabsTrigger>
              <TabsTrigger value="properties">Props</TabsTrigger>
              <TabsTrigger value="quotations">
                Quotes {linkedQuotations.length > 0 && `(${linkedQuotations.length})`}
              </TabsTrigger>
            </TabsList>
            
            <div className="p-4">
              <TabsContent value="coverage" className="mt-0 space-y-4">
                <ScaleCalibration floorPlan={projectData.floorPlan} />
                <CoverageAnalysis
                  cameras={projectData.cameras}
                  coverageSettings={projectData.coverageSettings}
                  onCoverageSettingsChange={(settings) =>
                    setProjectData({ ...projectData, coverageSettings: settings })
                  }
                  canvasWidth={2000}
                  canvasHeight={1500}
                  pixelsPerMeter={pixelsPerMeter}
                />
              </TabsContent>
              
              <TabsContent value="layers" className="mt-0">
                <LayerManagement
                  layerSettings={projectData.layerSettings}
                  onLayerSettingsChange={(settings) =>
                    setProjectData({ ...projectData, layerSettings: settings })
                  }
                />
              </TabsContent>
              
              <TabsContent value="zones" className="mt-0">
                <ZoneManager
                  zones={projectData.securityZones}
                  onZonesChange={(zones) =>
                    setProjectData({ ...projectData, securityZones: zones })
                  }
                />
              </TabsContent>
              
              <TabsContent value="properties" className="mt-0">
                <PropertiesSidebar
                  selected={selected}
                  onUpdate={updateSelected}
                  onDelete={deleteSelected}
                  pixelsPerMeter={pixelsPerMeter}
                />
              </TabsContent>

              <TabsContent value="quotations" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Linked Quotations</h3>
                    {linkedQuotations.length > 0 && (
                      <Badge variant="secondary">{linkedQuotations.length}</Badge>
                    )}
                  </div>

                  {!savedLayoutId ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Save the layout first to view linked quotations
                    </div>
                  ) : linkedQuotations.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No quotations linked to this layout yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {linkedQuotations.map((quotation) => (
                        <div key={quotation.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{quotation.quotation_number}</p>
                              <p className="text-xs text-muted-foreground">{quotation.customer_name}</p>
                            </div>
                            <p className="text-sm font-semibold">${quotation.total.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={quotation.status === "sent" ? "default" : "secondary"} className="text-xs">
                              {quotation.status === "sent" ? "Sent" : "Unsent"}
                            </Badge>
                            <Badge variant={quotation.is_completed ? "default" : "outline"} className="text-xs">
                              {quotation.is_completed ? "Done" : "Pending"}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2 text-xs"
                            onClick={() => navigate(`/transactions/quotation?quotationId=${quotation.id}`)}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Quotation
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
