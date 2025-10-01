import { Navigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
