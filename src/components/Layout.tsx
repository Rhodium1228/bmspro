// ===== IMPORTS =====
import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";

// ===== TYPES =====
/**
 * Props for Layout component
 * @property {ReactNode} children - Child components to be rendered in the main content area
 */
interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout Component
 * 
 * Main application layout wrapper that provides:
 * - Sidebar navigation (collapsible)
 * - Header with user info and sign out
 * - Main content area for page components
 * 
 * This layout is used across all authenticated pages
 */
export const Layout = ({ children }: LayoutProps) => {
  return (
    // SidebarProvider wraps the entire layout to manage sidebar state
    <SidebarProvider>
      {/* Main container with gradient background */}
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-secondary/10">
        {/* Sidebar navigation menu */}
        <AppSidebar />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col w-full">
          {/* Header with user info and sign out */}
          <Header />
          
          {/* Page content - children are rendered here */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
