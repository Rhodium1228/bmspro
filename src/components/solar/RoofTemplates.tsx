import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RoofTemplatesProps {
  onSelectTemplate: (template: any) => void;
}

const RoofTemplates = ({ onSelectTemplate }: RoofTemplatesProps) => {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["roof-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roof_templates")
        .select("*")
        .order("category");

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  const groupedTemplates = templates.reduce((acc: any, template) => {
    const category = template.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedTemplates).map(([category, items]: [string, any]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-3 capitalize">{category}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((template: any) => (
              <Card
                key={template.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {template.image_url ? (
                    <img
                      src={template.image_url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground">No image</div>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{template.name}</p>
                    {template.roof_type && (
                      <Badge variant="secondary" className="text-xs">
                        {template.roof_type}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    variant="outline"
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoofTemplates;
