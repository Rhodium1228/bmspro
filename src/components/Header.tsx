import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-6">
      <SidebarTrigger className="text-foreground" />
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user?.email}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};
