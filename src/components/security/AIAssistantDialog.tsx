import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CanvasObject } from "@/pages/SecurityDesign";
import { Loader2 } from "lucide-react";

interface AIAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasObjects: CanvasObject[];
  onApplySuggestions: (suggestions: CanvasObject[]) => void;
}

export const AIAssistantDialog = ({
  open,
  onOpenChange,
  canvasObjects,
  onApplySuggestions,
}: AIAssistantDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [placementDescription, setPlacementDescription] = useState("");
  const [viewingRange, setViewingRange] = useState("15");
  const [cameraTypeDescription, setCameraTypeDescription] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const handlePlacementSuggestions = async () => {
    if (!placementDescription.trim()) {
      toast({ title: "Error", description: "Please describe your property", variant: "destructive" });
      return;
    }

    setLoading(true);
    setAiResponse("");

    try {
      const { data, error } = await supabase.functions.invoke("security-ai-assistant", {
        body: {
          type: "placement",
          description: placementDescription,
        },
      });

      if (error) throw error;

      setAiResponse(data.suggestions);
      toast({ title: "Success", description: "AI suggestions generated!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCoverageAnalysis = async () => {
    setLoading(true);
    setAiResponse("");

    try {
      const { data, error } = await supabase.functions.invoke("security-ai-assistant", {
        body: {
          type: "coverage",
          canvasObjects,
          viewingRange: Number(viewingRange),
        },
      });

      if (error) throw error;

      setAiResponse(data.analysis);
      toast({ title: "Success", description: "Coverage analysis complete!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCameraTypeRecommendations = async () => {
    if (!cameraTypeDescription.trim()) {
      toast({ title: "Error", description: "Please describe your needs", variant: "destructive" });
      return;
    }

    setLoading(true);
    setAiResponse("");

    try {
      const { data, error } = await supabase.functions.invoke("security-ai-assistant", {
        body: {
          type: "camera-types",
          description: cameraTypeDescription,
        },
      });

      if (error) throw error;

      setAiResponse(data.recommendations);
      toast({ title: "Success", description: "Camera recommendations generated!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>AI Security Planner</DialogTitle>
          <DialogDescription>
            Get AI-powered suggestions for camera placement, coverage analysis, and camera type recommendations.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="placement" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="placement">Placement</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="camera-types">Camera Types</TabsTrigger>
          </TabsList>

          <TabsContent value="placement" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="placement-description">Describe Your Property</Label>
              <Textarea
                id="placement-description"
                placeholder="E.g., Two-story residential home with front yard, backyard, and garage. Main entrance faces north. Need coverage for entry points and perimeter."
                value={placementDescription}
                onChange={(e) => setPlacementDescription(e.target.value)}
                rows={5}
              />
            </div>
            <Button onClick={handlePlacementSuggestions} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Placement Suggestions
            </Button>
          </TabsContent>

          <TabsContent value="coverage" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="viewing-range">Viewing Range (meters)</Label>
              <Input
                id="viewing-range"
                type="number"
                value={viewingRange}
                onChange={(e) => setViewingRange(e.target.value)}
                min="5"
                max="50"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Analyzing {canvasObjects.filter(obj => obj.type === "camera").length} cameras currently placed on canvas.
            </p>
            <Button onClick={handleCoverageAnalysis} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Coverage
            </Button>
          </TabsContent>

          <TabsContent value="camera-types" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="camera-type-description">Describe Your Building and Needs</Label>
              <Textarea
                id="camera-type-description"
                placeholder="E.g., Small retail store in a busy shopping district. Need cameras for checkout area, entrance, and back storage room. Looking for discreet but effective monitoring."
                value={cameraTypeDescription}
                onChange={(e) => setCameraTypeDescription(e.target.value)}
                rows={5}
              />
            </div>
            <Button onClick={handleCameraTypeRecommendations} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Camera Recommendations
            </Button>
          </TabsContent>
        </Tabs>

        {aiResponse && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">AI Response:</h4>
            <div className="whitespace-pre-wrap text-sm">{aiResponse}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
