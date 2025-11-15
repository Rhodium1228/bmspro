import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, Calendar as CalendarIcon, FastForward } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
  battery_level: number;
}

interface HistoryData {
  employee_id: string;
  employee_name: string;
  designation: string;
  locations: LocationPoint[];
}

interface LocationHistoryProps {
  map: google.maps.Map | null;
  selectedEmployeeId: string | null;
}

export const LocationHistory = ({ map, selectedEmployeeId }: LocationHistoryProps) => {
  const { session } = useAuth();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(false);

  const markerRef = useRef<google.maps.Marker | null>(null);
  const pathRef = useRef<google.maps.Polyline | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (markerRef.current) markerRef.current.setMap(null);
      if (pathRef.current) pathRef.current.setMap(null);
    };
  }, []);

  const fetchHistoryData = async () => {
    if (!selectedEmployeeId || !startDate || !endDate || !session?.user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("staff_locations")
        .select(`
          latitude,
          longitude,
          timestamp,
          accuracy,
          battery_level,
          employee_id,
          employees!inner(name, designation, user_id)
        `)
        .eq("employee_id", selectedEmployeeId)
        .eq("employees.user_id", session.user.id)
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString())
        .order("timestamp", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const employee = data[0].employees as any;
        setHistoryData({
          employee_id: selectedEmployeeId,
          employee_name: employee.name,
          designation: employee.designation,
          locations: data.map(loc => ({
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
            timestamp: loc.timestamp,
            accuracy: loc.accuracy || 0,
            battery_level: loc.battery_level || 0,
          })),
        });
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (historyData && map) {
      // Draw the complete path
      const path = historyData.locations.map(loc => ({
        lat: loc.latitude,
        lng: loc.longitude,
      }));

      if (pathRef.current) {
        pathRef.current.setMap(null);
      }

      pathRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "hsl(var(--primary))",
        strokeOpacity: 0.6,
        strokeWeight: 3,
        map,
      });

      // Fit bounds to show entire path
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);

      // Create initial marker
      if (path.length > 0) {
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        markerRef.current = new google.maps.Marker({
          position: path[0],
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "hsl(var(--primary))",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
          },
        });
      }
    }
  }, [historyData, map]);

  useEffect(() => {
    if (historyData && markerRef.current && currentIndex < historyData.locations.length) {
      const location = historyData.locations[currentIndex];
      markerRef.current.setPosition({
        lat: location.latitude,
        lng: location.longitude,
      });
    }
  }, [currentIndex, historyData]);

  useEffect(() => {
    if (isPlaying && historyData) {
      playbackTimerRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= historyData.locations.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);

      return () => {
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      };
    }
  }, [isPlaying, playbackSpeed, historyData]);

  const handlePlayPause = () => {
    if (currentIndex >= (historyData?.locations.length || 0) - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleSliderChange = (value: number[]) => {
    setIsPlaying(false);
    setCurrentIndex(value[0]);
  };

  const currentLocation = historyData?.locations[currentIndex];

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Location History Playback</h3>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(!startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(!endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>

          <Button onClick={fetchHistoryData} disabled={!selectedEmployeeId || !startDate || !endDate || loading}>
            Load History
          </Button>
        </div>
      </div>

      {historyData && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{historyData.employee_name}</span>
              <span className="text-muted-foreground">{historyData.designation}</span>
            </div>

            {currentLocation && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <p className="font-medium">{format(new Date(currentLocation.timestamp), "PPp")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Accuracy:</span>
                  <p className="font-medium">{currentLocation.accuracy.toFixed(0)}m</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Battery:</span>
                  <p className="font-medium">{currentLocation.battery_level}%</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Slider
              value={[currentIndex]}
              max={historyData.locations.length - 1}
              step={1}
              onValueChange={handleSliderChange}
              className="w-full"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                <Button size="sm" onClick={handlePlayPause}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {historyData.locations.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <FastForward className="h-4 w-4 text-muted-foreground" />
                <Select value={playbackSpeed.toString()} onValueChange={(v) => setPlaybackSpeed(Number(v))}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="5">5x</SelectItem>
                    <SelectItem value="10">10x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </>
      )}

      {!historyData && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Select a staff member, date range, and click "Load History" to view movement patterns
        </p>
      )}
    </Card>
  );
};
