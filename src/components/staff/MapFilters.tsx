import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Wifi } from "lucide-react";

interface MapFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  lastUpdateFilter: string;
  setLastUpdateFilter: (value: string) => void;
  showTrails: boolean;
  setShowTrails: (value: boolean) => void;
  totalStaff: number;
  onlineStaff: number;
}

export default function MapFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  lastUpdateFilter,
  setLastUpdateFilter,
  showTrails,
  setShowTrails,
  totalStaff,
  onlineStaff,
}: MapFiltersProps) {
  return (
    <Card className="p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <Label htmlFor="search" className="text-xs text-muted-foreground mb-1.5 block">
            Search Staff
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status" className="text-xs text-muted-foreground mb-1.5 block">
            Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">🟢 Online</SelectItem>
              <SelectItem value="offline">⚪ Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role Filter */}
        <div>
          <Label htmlFor="role" className="text-xs text-muted-foreground mb-1.5 block">
            Role
          </Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="staff">🔵 Staff</SelectItem>
              <SelectItem value="supervisor">🟢 Supervisor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Last Update Filter */}
        <div>
          <Label htmlFor="update" className="text-xs text-muted-foreground mb-1.5 block">
            Last Update
          </Label>
          <Select value={lastUpdateFilter} onValueChange={setLastUpdateFilter}>
            <SelectTrigger id="update">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Updates</SelectItem>
              <SelectItem value="recent">&lt; 5 min ago</SelectItem>
              <SelectItem value="old">&gt; 5 min ago</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats and Trails Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Staff:</span>
            <Badge variant="secondary">{totalStaff}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">Online:</span>
            <Badge variant="default" className="bg-green-600">{onlineStaff}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="trails" className="text-sm cursor-pointer">
            Show 30min trails
          </Label>
          <Switch
            id="trails"
            checked={showTrails}
            onCheckedChange={setShowTrails}
          />
        </div>
      </div>
    </Card>
  );
}
