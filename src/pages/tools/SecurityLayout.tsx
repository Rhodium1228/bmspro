import { useState } from "react";
import { SecurityToolbar } from "@/components/security/SecurityToolbar";
import { CanvasArea } from "@/components/security/CanvasArea";
import { PropertiesSidebar } from "@/components/security/PropertiesSidebar";
import { CoverageAnalysis } from "@/components/security/CoverageAnalysis";
import { FloorPlanTemplates } from "@/components/security/FloorPlanTemplates";
import { AiPlanner } from "@/components/security/AiPlanner";
import { LayerManagement } from "@/components/security/LayerManagement";
import { ZoneManager } from "@/components/security/ZoneManager";
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
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SecurityLayout() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [projectName, setProjectName] = useState("Untitled Security Layout");
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selected, setSelected] = useState<SelectedElement>(null);

  const [projectData, setProjectData] = useState<ProjectData>({
    cameras: [],
    pirs: [],
    fans: [],
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
      annotations: { visible: true, locked: false, opacity: 100 },
      coverage: { visible: true, locked: false, opacity: 100 },
    },
  });

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
      const { error } = await supabase.from("security_layouts").insert([{
        user_id: user.id,
        name: projectName,
        canvas_data: projectData as any,
        floor_plan_url: projectData.floorPlan?.url || null,
      }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Security layout saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save layout",
        variant: "destructive",
      });
    }
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
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Project
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
          onFloorPlanUpload={(floorPlan) => {
            setProjectData({ ...projectData, floorPlan });
          }}
          onFloorPlanUpdate={(updates) => {
            if (projectData.floorPlan) {
              setProjectData({
                ...projectData,
                floorPlan: { ...projectData.floorPlan, ...updates },
              });
            }
          }}
          onSelect={setSelected}
          onClearAll={() => {
            setProjectData({
              cameras: [],
              pirs: [],
              fans: [],
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
                annotations: { visible: true, locked: false, opacity: 100 },
                coverage: { visible: true, locked: false, opacity: 100 },
              },
            });
            setSelected(null);
          }}
        />

        <div className="w-80 border-l overflow-y-auto">
          <Tabs defaultValue="coverage" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="coverage">Coverage</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="zones">Zones</TabsTrigger>
              <TabsTrigger value="properties">Props</TabsTrigger>
            </TabsList>
            
            <div className="p-4">
              <TabsContent value="coverage" className="mt-0">
                <CoverageAnalysis
                  cameras={projectData.cameras}
                  coverageSettings={projectData.coverageSettings}
                  onCoverageSettingsChange={(settings) =>
                    setProjectData({ ...projectData, coverageSettings: settings })
                  }
                  canvasWidth={2000}
                  canvasHeight={1500}
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
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
