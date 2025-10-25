import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Home, Building2, Store, Warehouse, Building, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface Template {
  id: string;
  name: string;
  category: string;
  image_url: string;
  dimensions: {
    width: number;
    height: number;
  };
}

interface FloorPlanTemplatesProps {
  onSelectTemplate: (template: Template) => void;
}

export const FloorPlanTemplates = ({ onSelectTemplate }: FloorPlanTemplatesProps) => {
  const [open, setOpen] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["floor-plan-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("floor_plan_templates")
        .select("*")
        .order("category", { ascending: true });
      
      if (error) throw error;
      
      return data?.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        image_url: t.image_url,
        dimensions: t.dimensions as { width: number; height: number },
      })) as Template[];
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "residential":
        return Home;
      case "office":
        return Building2;
      case "retail":
        return Store;
      case "industrial":
        return Warehouse;
      default:
        return Building;
    }
  };

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-4">
            {templates?.map((template) => {
              const Icon = getCategoryIcon(template.category);
              return (
                <Button
                  key={template.id}
                  variant="outline"
                  className="h-auto flex-col gap-2 p-6"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <Icon className="h-12 w-12" />
                  <div className="text-center">
                    <p className="font-semibold">{template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.dimensions.width} x {template.dimensions.height}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
