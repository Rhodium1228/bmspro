import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PanelSpec } from "@/lib/solarTypes";

interface PanelSpecSelectorProps {
  specs: Map<string, PanelSpec>;
  selectedSpecId: string | null;
  onSelectSpec: (specId: string) => void;
}

const PanelSpecSelector = ({ specs, selectedSpecId, onSelectSpec }: PanelSpecSelectorProps) => {
  const selectedSpec = selectedSpecId ? specs.get(selectedSpecId) : null;

  return (
    <Select value={selectedSpecId || undefined} onValueChange={onSelectSpec}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select panel type">
          {selectedSpec && (
            <div className="flex items-center gap-2">
              <span className="font-medium">{selectedSpec.wattage}W</span>
              <span className="text-muted-foreground text-sm">
                {selectedSpec.dimensions_mm.cells?.rows}x{selectedSpec.dimensions_mm.cells?.cols} cells
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Array.from(specs.values()).map((spec) => (
          <SelectItem key={spec.id} value={spec.id}>
            <div className="flex flex-col gap-1 py-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{spec.name}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {spec.wattage}W
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {spec.dimensions_mm.width} × {spec.dimensions_mm.height}mm
                {spec.dimensions_mm.cells && (
                  <span className="ml-2">
                    ({spec.dimensions_mm.cells.rows}×{spec.dimensions_mm.cells.cols} cells)
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {spec.efficiency}% efficiency • {spec.voltage}V
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PanelSpecSelector;
