import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/integrations/supabase/auth";
import { ProtectedRoute } from "@/pages/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Bank from "./pages/masters/Bank";
import Items from "./pages/masters/Items";
import Employees from "./pages/masters/Employees";
import Customers from "./pages/masters/Customers";
import Quotation from "./pages/transactions/Quotation";
import JobCard from "./pages/transactions/JobCard";
import Company from "./pages/more/Company";
import Options from "./pages/more/Options";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
              path="/transactions/jobcard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <JobCard />
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
            
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
