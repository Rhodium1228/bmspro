import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Home, Building2, Store, Warehouse, Building } from "lucide-react";

interface FloorPlanTemplatesProps {
  onSelectTemplate: (templateName: string) => void;
}

export const FloorPlanTemplates = ({ onSelectTemplate }: FloorPlanTemplatesProps) => {
  const templates = [
    {
      name: "Single Family Home",
      icon: Home,
      dimensions: "6m x 6m",
    },
    {
      name: "Apartment Unit",
      icon: Building,
      dimensions: "10m x 20m",
    },
    {
      name: "Office Space",
      icon: Building2,
      dimensions: "14m x 30m",
    },
    {
      name: "Retail Store",
      icon: Store,
      dimensions: "16m x 40m",
    },
    {
      name: "Warehouse",
      icon: Warehouse,
      dimensions: "30m x 60m",
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Select Template</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Choose a Floor Plan Template</DialogTitle>
          <DialogDescription>
            Select a pre-built template to quickly start your security layout design
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Button
                key={template.name}
                variant="outline"
                className="h-auto flex-col gap-2 p-6"
                onClick={() => onSelectTemplate(template.name)}
              >
                <Icon className="h-12 w-12" />
                <div className="text-center">
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.dimensions}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
