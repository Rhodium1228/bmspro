// ===== IMPORTS =====
// UI Components
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// React Query for data fetching
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Routing
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Authentication and Layout
import { AuthProvider } from "@/integrations/supabase/auth";
import { ProtectedRoute } from "@/pages/ProtectedRoute";
import { Layout } from "@/components/Layout";

// Page Components
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Bank from "./pages/masters/Bank";
import Items from "./pages/masters/Items";
import Employees from "./pages/masters/Employees";
import Customers from "./pages/masters/Customers";
import Quotation from "./pages/transactions/Quotation";
import SaleOrder from "./pages/transactions/SaleOrder";
import PurchaseOrder from "./pages/transactions/PurchaseOrder";
import Company from "./pages/more/Company";
import Options from "./pages/more/Options";
import SecurityLayout from "./pages/tools/SecurityLayout";
import SecurityProjects from "./pages/tools/SecurityProjects";
import SolarLayout from "./pages/tools/SolarLayout";
import SolarProjects from "./pages/tools/SolarProjects";
import NotFound from "./pages/NotFound";

// ===== QUERY CLIENT CONFIGURATION =====
/**
 * React Query client configuration
 * Sets default options for all queries
 * - staleTime: Data is considered fresh for 60 seconds
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds
    },
  },
});

// ===== MAIN APP COMPONENT =====
/**
 * App Component
 * 
 * Root component that sets up:
 * - React Query for data fetching
 * - Toast notifications (Toaster and Sonner)
 * - Tooltips
 * - Routing (React Router)
 * - Authentication (Supabase Auth)
 * 
 * All routes are defined here with proper authentication protection
 */
const App = () => {
  return (
    // React Query provider for data fetching and caching
    <QueryClientProvider client={queryClient}>
      {/* Tooltip provider for UI tooltips */}
      <TooltipProvider>
        {/* Toast notification components */}
        <Toaster />
        <Sonner />
        
        {/* Browser router for navigation */}
        <BrowserRouter>
          {/* Authentication provider wraps all routes */}
          <AuthProvider>
            <Routes>
            {/* Root redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Public auth route */}
            <Route path="/auth" element={<Auth />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/masters/bank"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Bank />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/masters/items"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Items />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/masters/employees"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Employees />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/masters/customers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Customers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/transactions/quotation"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Quotation />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/transactions/sale-order"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SaleOrder />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/transactions/purchase-order"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseOrder />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/more/company"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Company />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/more/options"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Options />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tools/security-projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SecurityProjects />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tools/security-layout"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SecurityLayout />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tools/solar-projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SolarProjects />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tools/solar-layout"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SolarLayout />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
