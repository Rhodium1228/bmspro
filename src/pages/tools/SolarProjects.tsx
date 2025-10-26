import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";

const SolarProjects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["solar-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solar_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleNewProject = () => {
    navigate("/tools/solar-layout");
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/tools/solar-layout?projectId=${projectId}`);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("solar_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Solar Panel Projects</h1>
            <p className="text-muted-foreground mt-2">
              Design and manage your solar panel layouts
            </p>
          </div>
          <Button onClick={handleNewProject} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Project
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No projects found</p>
              <Button onClick={handleNewProject}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const canvasData = project.canvas_data as any;
              const panelCount = canvasData?.panels?.length || 0;

              return (
                <Card
                  key={project.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {project.export_image_url ? (
                      <img
                        src={project.export_image_url}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground">No preview</div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {panelCount} panels
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SolarProjects;
