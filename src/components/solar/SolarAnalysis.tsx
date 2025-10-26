import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateSystemOutput, calculateFinancials } from "@/lib/solarCalculations";
import { SolarPanel, PanelSpec } from "@/lib/solarTypes";
import { Zap, DollarSign, Leaf, TrendingUp } from "lucide-react";

interface SolarAnalysisProps {
  panels: SolarPanel[];
  panelSpecs: Map<string, PanelSpec>;
  peakSunHours: number;
  electricityRate: number;
  installationCost: number;
}

const SolarAnalysis = ({
  panels,
  panelSpecs,
  peakSunHours = 5,
  electricityRate = 0.25,
  installationCost = 0,
}: SolarAnalysisProps) => {
  const activePanels = panels.filter(p => p.isActive);
  
  // Calculate total wattage from different panel types
  const totalWattage = activePanels.reduce((sum, panel) => {
    const spec = panelSpecs.get(panel.panelSpecId);
    return sum + (spec?.wattage || 0);
  }, 0);

  // Group panels by spec for breakdown
  const panelsBySpec = new Map<string, number>();
  activePanels.forEach(panel => {
    const count = panelsBySpec.get(panel.panelSpecId) || 0;
    panelsBySpec.set(panel.panelSpecId, count + 1);
  });

  const systemCalc = calculateSystemOutput(
    activePanels.length,
    totalWattage,
    peakSunHours
  );

  const financialCalc = calculateFinancials(
    systemCalc.estimatedKwhPerYear,
    electricityRate,
    installationCost
  );

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="environmental">Environmental</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System Overview
            </CardTitle>
          </CardHeader>
           <CardContent className="space-y-3">
            {/* Panel breakdown */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium mb-2">Panel Breakdown</div>
              {Array.from(panelsBySpec.entries()).map(([specId, count]) => {
                const spec = panelSpecs.get(specId);
                if (!spec) return null;
                return (
                  <div key={specId} className="text-xs text-muted-foreground">
                    {count}× {spec.wattage}W {spec.name}
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Panels</span>
              <span className="font-semibold">{systemCalc.totalPanels}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">System Capacity</span>
              <span className="font-semibold">{systemCalc.totalWattage.toFixed(2)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Daily Generation</span>
              <span className="font-semibold">{systemCalc.estimatedKwhPerDay.toFixed(1)} kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Yearly Generation</span>
              <span className="font-semibold">{systemCalc.estimatedKwhPerYear.toFixed(0)} kWh</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="financial" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yearly Savings</span>
              <span className="font-semibold text-green-600">
                ${financialCalc.yearlySavings.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">25-Year Savings</span>
              <span className="font-semibold text-green-600">
                ${financialCalc.totalSavings25Years.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payback Period</span>
              <span className="font-semibold">
                {financialCalc.paybackPeriod.toFixed(1)} years
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ROI (25 years)</span>
              <span className="font-semibold text-green-600">
                {financialCalc.roi.toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="environmental" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Environmental Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CO₂ Offset (Yearly)</span>
              <span className="font-semibold text-green-600">
                {systemCalc.co2OffsetKg.toFixed(0)} kg
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Equivalent Trees</span>
              <span className="font-semibold text-green-600">
                {systemCalc.equivalentTrees.toFixed(0)} trees
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">25-Year CO₂ Offset</span>
              <span className="font-semibold text-green-600">
                {(systemCalc.co2OffsetKg * 25 / 1000).toFixed(1)} tonnes
              </span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SolarAnalysis;
