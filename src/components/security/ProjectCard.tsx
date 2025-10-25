import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Camera, FileText, MoreVertical, Pencil, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface ProjectCardProps {
  project: any;
  viewMode: "grid" | "list";
}

export function ProjectCard({ project, viewMode }: ProjectCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canvasData = project.canvas_data as any;
  const cameraCount = canvasData?.cameras?.length || 0;
  const pirCount = canvasData?.pirs?.length || 0;
  const quotationCount = (project.quotations as any)?.[0]?.count || 0;

  const handleOpen = () => {
    navigate(`/tools/security-layout?layoutId=${project.id}`);
  };

  const handleDuplicate = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase.from("security_layouts").insert([
        {
          user_id: userData.user.id,
          name: `${project.name} (Copy)`,
          canvas_data: project.canvas_data,
          floor_plan_url: project.floor_plan_url,
          coverage_settings: project.coverage_settings,
          layer_settings: project.layer_settings,
          annotations: project.annotations,
          security_zones: project.security_zones,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Project duplicated",
        description: "A copy has been created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["security-projects"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to duplicate project",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("security_layouts")
        .delete()
        .eq("id", project.id);

      if (error) throw error;

      toast({
        title: "Project deleted",
        description: "The project has been removed",
      });

      queryClient.invalidateQueries({ queryKey: ["security-projects"] });
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (viewMode === "list") {
    return (
      <>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div className="w-32 h-24 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
              {project.export_image_url ? (
                <img
                  src={project.export_image_url}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{project.name}</h3>
              <p className="text-sm text-muted-foreground">
                Updated {format(new Date(project.updated_at), "MMM d, yyyy")}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {cameraCount} Cameras
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {pirCount} PIRs
                </Badge>
                {quotationCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {quotationCount} {quotationCount === 1 ? "Quote" : "Quotes"}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleOpen}>Open</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleOpen}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{project.name}"? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Grid view
  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
        {/* Thumbnail */}
        <div
          className="aspect-video bg-muted flex items-center justify-center cursor-pointer overflow-hidden"
          onClick={handleOpen}
        >
          {project.export_image_url ? (
            <img
              src={project.export_image_url}
              alt={project.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <Camera className="h-12 w-12 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3
              className="font-semibold text-lg truncate flex-1 cursor-pointer hover:text-primary"
              onClick={handleOpen}
            >
              {project.name}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpen}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            {format(new Date(project.updated_at), "MMM d, yyyy 'at' h:mm a")}
          </p>

          <div className="flex gap-2 flex-wrap mb-3">
            <Badge variant="secondary" className="text-xs">
              {cameraCount} Cameras
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {pirCount} PIRs
            </Badge>
            {quotationCount > 0 && (
              <Badge variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                {quotationCount}
              </Badge>
            )}
          </div>

          <Button onClick={handleOpen} className="w-full">
            Open Project
          </Button>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
