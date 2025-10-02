// ===== IMPORTS =====
// Import UI components and utilities
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/**
 * Header Component
 * 
 * Displays the application header with:
 * - Sidebar toggle button for collapsing/expanding sidebar
 * - User email display
 * - Sign out button
 * 
 * The header is sticky and appears at the top of all pages
 */
export const Header = () => {
  // ===== HOOKS =====
  // Get current user and sign out function from auth context
  const { user, signOut } = useAuth();
  // Navigation hook for redirecting after sign out
  const navigate = useNavigate();

  // ===== EVENT HANDLERS =====
  /**
   * Handle user sign out
   * Signs the user out, shows success message, and redirects to auth page
   */
  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  // ===== RENDER =====
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-6">
      {/* Sidebar toggle button - allows users to collapse/expand sidebar */}
      <SidebarTrigger className="text-foreground" />
      
      {/* Spacer to push user info to the right */}
      <div className="flex-1" />
      
      {/* User information and sign out section */}
      <div className="flex items-center gap-4">
        {/* Display current user's email */}
        <span className="text-sm text-muted-foreground">
          {user?.email}
        </span>
        {/* Sign out button */}
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
