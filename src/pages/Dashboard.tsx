import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Package,
  Users,
  UserCog,
  FileEdit,
  TrendingUp,
  DollarSign,
  Activity,
  MapPin,
  Navigation,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const stats = [
  {
    title: "Total Revenue",
    value: "₹45,231.89",
    change: "+20.1%",
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    title: "Active Customers",
    value: "2,350",
    change: "+12.5%",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Total Items",
    value: "1,234",
    change: "+5.2%",
    icon: Package,
    color: "text-purple-600",
  },
  {
    title: "Pending Quotations",
    value: "89",
    change: "-4.3%",
    icon: FileEdit,
    color: "text-orange-600",
  },
];

const recentActivity = [
  { action: "New quotation created", time: "2 hours ago", icon: FileEdit },
  { action: "Customer added", time: "4 hours ago", icon: UserCog },
  { action: "Item stock updated", time: "6 hours ago", icon: Package },
  { action: "Bank account verified", time: "1 day ago", icon: Building2 },
];

interface StaffLocation {
  id: string;
  employee_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  battery_level: number | null;
  accuracy_level: string;
  timestamp: string;
  name: string;
  designation: string;
  status: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staffLocations, setStaffLocations] = useState<StaffLocation[]>([]);

  const fetchStaffLocations = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("staff_locations")
      .select(`
        id,
        employee_id,
        latitude,
        longitude,
        accuracy,
        battery_level,
        accuracy_level,
        timestamp,
        employees!inner(
          name,
          designation,
          user_id
        )
      `)
      .eq("employees.user_id", user.id)
      .eq("is_active", true)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching staff locations:", error);
      return;
    }

    // Group by employee_id and get latest location
    const latestLocations = new Map<string, any>();
    data?.forEach((loc: any) => {
      if (!latestLocations.has(loc.employee_id)) {
        const employee = loc.employees;
        const now = new Date();
        const timestamp = new Date(loc.timestamp);
        const minutesAgo = (now.getTime() - timestamp.getTime()) / (1000 * 60);
        
        latestLocations.set(loc.employee_id, {
          ...loc,
          name: employee.name,
          designation: employee.designation,
          status: minutesAgo <= 10 ? "online" : "offline",
        });
      }
    });

    setStaffLocations(Array.from(latestLocations.values()));
  }, [user]);

  useEffect(() => {
    fetchStaffLocations();
  }, [fetchStaffLocations]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dashboard-staff-locations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "staff_locations",
        },
        () => {
          fetchStaffLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchStaffLocations]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to BMS PRO - Your Business Management System</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {stat.title === "Total Revenue" && <DollarSign className="h-6 w-6" />}
                {stat.value}
              </div>
              <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Live Staff Locations
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/staff/locations")}
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            View Map
          </Button>
        </CardHeader>
        <CardContent>
          {staffLocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No staff locations available</p>
              <p className="text-xs mt-1">Staff locations will appear when mobile app sends GPS data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staffLocations.slice(0, 5).map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <div className={`h-3 w-3 rounded-full ${
                    staff.status === "online" 
                      ? "bg-green-500 animate-pulse" 
                      : "bg-gray-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{staff.name}</p>
                    <p className="text-xs text-muted-foreground">{staff.designation}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={staff.status === "online" ? "default" : "outline"}
                      className="text-xs"
                    >
                      {staff.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(staff.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {staffLocations.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/staff/locations")}
                  className="w-full"
                >
                  View all {staffLocations.length} staff locations
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Employees</span>
                <span className="text-sm font-bold">156</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Bank Accounts</span>
                <span className="text-sm font-bold">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Transactions</span>
                <span className="text-sm font-bold">3,456</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Customer Satisfaction</span>
                <span className="text-sm font-bold">94%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
