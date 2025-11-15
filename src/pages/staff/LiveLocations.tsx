import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Maximize2, Minimize2 } from "lucide-react";
import StaffDrawer from "@/components/staff/StaffDrawer";
import MapFilters from "@/components/staff/MapFilters";

interface StaffLocation {
  id: string;
  employee_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  battery_level: number | null;
  accuracy_level: string;
  current_job_id: string | null;
  is_active: boolean;
  timestamp: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
  status: string;
}

interface MarkerData {
  marker: google.maps.Marker;
  location: StaffLocation;
}

export default function LiveLocations() {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerData>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffLocation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [locations, setLocations] = useState<StaffLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [lastUpdateFilter, setLastUpdateFilter] = useState("all");
  const [showTrails, setShowTrails] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return;

    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (!mapRef.current) return;

      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: -33.8688, lng: 151.2093 }, // Sydney default
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Fetch initial locations
  const fetchLocations = useCallback(async () => {
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
        current_job_id,
        is_active,
        timestamp,
        employees!inner(
          name,
          designation,
          phone,
          email,
          user_id
        )
      `)
      .eq("employees.user_id", user.id)
      .eq("is_active", true)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load staff locations");
      return;
    }

    // Group by employee_id and get the latest location for each
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
          phone: employee.phone,
          email: employee.email,
          status: minutesAgo <= 10 ? "online" : "offline",
        });
      }
    });

    const formattedLocations = Array.from(latestLocations.values());
    setLocations(formattedLocations);
    updateMarkers(formattedLocations);
  }, [user]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("staff-locations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "staff_locations",
        },
        () => {
          fetchLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchLocations]);

  // Create marker icon based on role and status
  const createMarkerIcon = (designation: string, status: string, accuracy: string) => {
    let color = "#3B82F6"; // Blue for staff
    if (designation.toLowerCase().includes("supervisor")) {
      color = "#10B981"; // Green for supervisor
    }
    if (status === "offline") {
      color = "#9CA3AF"; // Grey for offline
    }
    if (accuracy === "low") {
      color = "#FBBF24"; // Yellow for low accuracy
    }

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: 8,
    };
  };

  // Update markers on map
  const updateMarkers = useCallback((newLocations: StaffLocation[]) => {
    if (!mapInstanceRef.current) return;

    const bounds = new google.maps.LatLngBounds();
    const existingMarkers = new Set(markersRef.current.keys());

    newLocations.forEach((location) => {
      const position = { lat: Number(location.latitude), lng: Number(location.longitude) };
      bounds.extend(position);

      const existing = markersRef.current.get(location.employee_id);

      if (existing) {
        // Update existing marker
        existing.marker.setPosition(position);
        existing.marker.setIcon(createMarkerIcon(location.designation, location.status, location.accuracy_level));
        existing.location = location;
        existingMarkers.delete(location.employee_id);
      } else {
        // Create new marker
        const marker = new google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          icon: createMarkerIcon(location.designation, location.status, location.accuracy_level),
          title: location.name,
        });

        marker.addListener("click", () => {
          setSelectedStaff(location);
          setDrawerOpen(true);
        });

        markersRef.current.set(location.employee_id, { marker, location });
      }
    });

    // Remove markers for employees no longer in the list
    existingMarkers.forEach((employeeId) => {
      const markerData = markersRef.current.get(employeeId);
      if (markerData) {
        markerData.marker.setMap(null);
        markersRef.current.delete(employeeId);
      }
    });

    // Auto-fit map to show all markers
    if (newLocations.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, []);

  // Filter locations based on search and filters
  const filteredLocations = locations.filter((loc) => {
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || loc.status === statusFilter;
    const matchesRole = roleFilter === "all" || 
      (roleFilter === "supervisor" && loc.designation.toLowerCase().includes("supervisor")) ||
      (roleFilter === "staff" && !loc.designation.toLowerCase().includes("supervisor"));
    
    const now = new Date();
    const timestamp = new Date(loc.timestamp);
    const minutesAgo = (now.getTime() - timestamp.getTime()) / (1000 * 60);
    const matchesUpdate = lastUpdateFilter === "all" ||
      (lastUpdateFilter === "recent" && minutesAgo <= 5) ||
      (lastUpdateFilter === "old" && minutesAgo > 5);

    return matchesSearch && matchesStatus && matchesRole && matchesUpdate;
  });

  // Update markers when filters change
  useEffect(() => {
    updateMarkers(filteredLocations);
  }, [filteredLocations, updateMarkers]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Live Staff Locations</h1>
          <p className="text-muted-foreground">Real-time GPS tracking of staff and supervisors</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="gap-2"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </Button>
        </div>
      </div>

      <MapFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        lastUpdateFilter={lastUpdateFilter}
        setLastUpdateFilter={setLastUpdateFilter}
        showTrails={showTrails}
        setShowTrails={setShowTrails}
        totalStaff={locations.length}
        onlineStaff={locations.filter((l) => l.status === "online").length}
      />

      <Card className={`flex-1 ${isFullscreen ? "fixed inset-4 z-50" : ""} overflow-hidden`}>
        <div ref={mapRef} className="w-full h-full" />
      </Card>

      <StaffDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        staff={selectedStaff}
      />
    </div>
  );
}
