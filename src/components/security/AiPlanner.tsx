import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AiPlanner = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  // Placement tab
  const [buildingType, setBuildingType] = useState("residential");
  const [securityNeeds, setSecurityNeeds] = useState("");

  // Coverage tab
  const [areaSize, setAreaSize] = useState("10x20");

  // Camera types tab
  const [cameraUse, setCameraUse] = useState("indoor");

  const handlePlacementAnalysis = async () => {
    setIsLoading(true);
    try {
      // TODO: Integrate with Lovable AI
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setAiResponse(
        `For a ${buildingType} property with needs: ${securityNeeds}\n\n` +
        `Recommended camera placement:\n` +
        `- Entry points: 2-3 cameras with 90° FOV\n` +
        `- Perimeter coverage: 4-6 cameras with 130° FOV\n` +
        `- Blind spot monitoring: Additional 2 cameras\n\n` +
        `Optimal heights: 2.5-3m for identification range`
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoverageAnalysis = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const [width, height] = areaSize.split("x").map(Number);
      setAiResponse(
        `Coverage analysis for ${width}m x ${height}m area:\n\n` +
        `Identification range (0-30m): ${Math.ceil((width * height) / 900)} cameras needed\n` +
        `Good view range (30-60m): Effective coverage with current placement\n` +
        `Average view range (60-120m): Extended monitoring zones covered\n\n` +
        `Recommended: Place cameras at corners with overlapping FOVs`
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze coverage",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraTypeRecommendation = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setAiResponse(
        `Camera recommendations for ${cameraUse} use:\n\n` +
        `- Dome cameras: Discreet, 360° coverage\n` +
        `- Bullet cameras: Long-range, weatherproof\n` +
        `- PTZ cameras: Pan-tilt-zoom for flexible monitoring\n` +
        `- Fisheye cameras: Ultra-wide 180° FOV\n\n` +
        `Resolution: Minimum 4MP for facial recognition`
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Security Planner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Security Planner</DialogTitle>
          <DialogDescription>
            Get AI-powered recommendations for optimal camera placement and security coverage
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="placement" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="placement">Placement</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="types">Camera Types</TabsTrigger>
          </TabsList>

          <TabsContent value="placement" className="space-y-4">
            <div className="space-y-2">
              <Label>Building Type</Label>
              <Select value={buildingType} onValueChange={setBuildingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Security Needs</Label>
              <Textarea
                value={securityNeeds}
                onChange={(e) => setSecurityNeeds(e.target.value)}
                placeholder="Describe your security requirements..."
                rows={3}
              />
            </div>

            <Button onClick={handlePlacementAnalysis} disabled={isLoading} className="w-full">
              {isLoading ? "Analyzing..." : "Get Placement Recommendations"}
            </Button>
          </TabsContent>

          <TabsContent value="coverage" className="space-y-4">
            <div className="space-y-2">
              <Label>Area Size</Label>
              <Select value={areaSize} onValueChange={setAreaSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6x6">6m x 6m (Single Family)</SelectItem>
                  <SelectItem value="10x20">10m x 20m (Apartment)</SelectItem>
                  <SelectItem value="14x30">14m x 30m (Office)</SelectItem>
                  <SelectItem value="16x40">16m x 40m (Retail)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="text-red-500">●</span> 0-30m: Identification range</p>
              <p><span className="text-blue-500">●</span> 30-60m: Good view range</p>
              <p><span className="text-green-500">●</span> 60-120m: Average view range</p>
            </div>

            <Button onClick={handleCoverageAnalysis} disabled={isLoading} className="w-full">
              {isLoading ? "Analyzing..." : "Analyze Coverage"}
            </Button>
          </TabsContent>

          <TabsContent value="types" className="space-y-4">
            <div className="space-y-2">
              <Label>Use Case</Label>
              <Select value={cameraUse} onValueChange={setCameraUse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Indoor Monitoring</SelectItem>
                  <SelectItem value="outdoor">Outdoor Surveillance</SelectItem>
                  <SelectItem value="perimeter">Perimeter Security</SelectItem>
                  <SelectItem value="entrance">Entrance Control</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCameraTypeRecommendation} disabled={isLoading} className="w-full">
              {isLoading ? "Analyzing..." : "Get Camera Recommendations"}
            </Button>
          </TabsContent>
        </Tabs>

        {aiResponse && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">AI Recommendations:</h4>
            <pre className="text-sm whitespace-pre-wrap">{aiResponse}</pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
