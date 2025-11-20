import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Sparkles, ChevronRight, Clock, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: any) => void;
}

export function TemplateSelector({ open, onOpenChange, onSelectTemplate }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["taskTemplates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_work_task_templates")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const defaultTemplates = templates.filter((t) => t.is_default);
  const customTemplates = templates.filter((t) => !t.is_default);

  const handleApply = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onOpenChange(false);
      setSelectedTemplate(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "security":
        return "🔒";
      case "network":
        return "🌐";
      case "solar":
        return "☀️";
      default:
        return "📋";
    }
  };

  const getTotalHours = (template: any) => {
    const templateData = template.template_data[0];
    if (!templateData?.sub_tasks) return 0;
    return templateData.sub_tasks.reduce((sum: number, task: any) => sum + (task.estimated_hours || 0), 0);
  };

  const renderTemplateCard = (template: any) => {
    const isSelected = selectedTemplate?.id === template.id;
    const templateData = template.template_data[0];
    const subTaskCount = templateData?.sub_tasks?.length || 0;
    const totalHours = getTotalHours(template);

    return (
      <Card
        key={template.id}
        className={cn(
          "p-4 cursor-pointer transition-all hover:shadow-md",
          isSelected && "ring-2 ring-primary shadow-md"
        )}
        onClick={() => setSelectedTemplate(template)}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="text-2xl">{getCategoryIcon(template.category)}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base truncate">{template.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {template.description}
                </p>
              </div>
            </div>
            {template.is_default && (
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Default
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {subTaskCount} sub-tasks
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              ~{totalHours}h total
            </span>
            {template.category && (
              <Badge variant="outline" className="text-xs">
                {template.category}
              </Badge>
            )}
          </div>

          {isSelected && templateData?.sub_tasks && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Includes:</p>
              <div className="space-y-1">
                {templateData.sub_tasks.slice(0, 3).map((task: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3" />
                    <span className="truncate">{task.item_name}</span>
                  </div>
                ))}
                {templateData.sub_tasks.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-5">
                    +{templateData.sub_tasks.length - 3} more tasks...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Apply Task Template
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="default" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="default">
              Default Templates ({defaultTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="custom">
              My Templates ({customTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="default" className="mt-4">
            <ScrollArea className="h-[450px] pr-4">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading templates...
                </div>
              ) : defaultTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No default templates available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {defaultTemplates.map(renderTemplateCard)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <ScrollArea className="h-[450px] pr-4">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading templates...
                </div>
              ) : customTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No custom templates yet</p>
                  <p className="text-sm mt-2">Create your own templates to reuse common task structures</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customTemplates.map(renderTemplateCard)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!selectedTemplate}>
            Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
