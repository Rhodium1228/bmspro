import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { ProjectCard } from "@/components/security/ProjectCard";
import { ProjectFilters } from "@/components/security/ProjectFilters";
import { Button } from "@/components/ui/button";
import { Plus, Grid3x3, List } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SecurityProjects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["security-projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_layouts")
        .select(`
          *,
          quotations:quotations(count)
        `)
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "newest") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      }
      return 0;
    });

  // Calculate statistics
  const totalCameras = projects.reduce((acc, p) => {
    const canvasData = p.canvas_data as any;
    return acc + (canvasData?.cameras?.length || 0);
  }, 0);

  const totalQuotations = projects.reduce((acc, p) => {
    return acc + ((p.quotations as any)?.[0]?.count || 0);
  }, 0);

  const handleNewProject = () => {
    navigate("/tools/security-layout");
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your security layout designs
          </p>
        </div>
        <Button onClick={handleNewProject} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{projects.length}</div>
          <div className="text-sm text-muted-foreground">Total Projects</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{totalCameras}</div>
          <div className="text-sm text-muted-foreground">Total Cameras</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{totalQuotations}</div>
          <div className="text-sm text-muted-foreground">Linked Quotations</div>
        </Card>
      </div>

      {/* Filters */}
      <ProjectFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="text-6xl">🔒</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No projects match your search"
                  : "Create your first security layout to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={handleNewProject} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
