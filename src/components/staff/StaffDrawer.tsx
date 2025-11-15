import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MapPin, Battery, Clock, User, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface StaffDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffLocation | null;
}

export default function StaffDrawer({ open, onOpenChange, staff }: StaffDrawerProps) {
  if (!staff) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-yellow-500";
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return "text-green-600";
    if (level > 20) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyBadge = (level: string) => {
    const variants = {
      high: "default",
      medium: "secondary",
      low: "destructive",
    } as const;
    return variants[level as keyof typeof variants] || "secondary";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(
                  staff.status
                )}`}
              />
            </div>
            <div className="text-left">
              <div className="font-semibold text-lg">{staff.name}</div>
              <div className="text-sm text-muted-foreground">{staff.designation}</div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Status
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant={staff.status === "online" ? "default" : "secondary"}>
                {staff.status === "online" ? "🟢 Online" : "⚪ Offline"}
              </Badge>
              <Badge variant={getAccuracyBadge(staff.accuracy_level)}>
                GPS: {staff.accuracy_level}
              </Badge>
              {staff.battery_level && (
                <Badge variant="outline" className="gap-1">
                  <Battery className={`h-3 w-3 ${getBatteryColor(staff.battery_level)}`} />
                  {staff.battery_level}%
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{staff.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{staff.email}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm space-y-1">
                  <div>Lat: {Number(staff.latitude).toFixed(6)}</div>
                  <div>Lng: {Number(staff.longitude).toFixed(6)}</div>
                  {staff.accuracy && (
                    <div className="text-muted-foreground">
                      Accuracy: ±{Math.round(staff.accuracy)}m
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Current Activity */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Current Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {staff.current_job_id ? `Job #${staff.current_job_id.slice(0, 8)}` : "No active job"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Last update: {formatDistanceToNow(new Date(staff.timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </Button>
            </div>
          </div>

          {/* Map Preview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Location Preview
            </h3>
            <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/view?key=${
                  import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                }&center=${staff.latitude},${staff.longitude}&zoom=15`}
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
