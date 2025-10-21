import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  image_url: string;
  dimensions: { width: number; height: number };
}

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (templateUrl: string, templateName: string) => void;
}

export const TemplateSelector = ({
  open,
  onOpenChange,
  onSelect,
}: TemplateSelectorProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("floor_plan_templates")
        .select("*")
        .order("category");

      if (error) throw error;
      setTemplates((data || []).map(t => ({
        ...t,
        dimensions: t.dimensions as { width: number; height: number }
      })));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (template: Template) => {
    onSelect(template.image_url, template.name);
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Select a Template</DialogTitle>
          <DialogDescription>
            Choose a pre-made floor plan template to start your security design.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 capitalize">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {templates
                    .filter(t => t.category === category)
                    .map(template => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow p-4"
                        onClick={() => handleSelect(template)}
                      >
                        <div className="aspect-video bg-muted rounded-md mb-2 flex items-center justify-center text-muted-foreground text-sm">
                          {template.name}
                        </div>
                        <p className="text-sm font-medium text-center">{template.name}</p>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
