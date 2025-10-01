import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Briefcase,
  Calendar,
} from "lucide-react";

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

const workerLocations = [
  { location: "Sydney Office", workers: 45, status: "active", color: "bg-green-500" },
  { location: "Melbourne Office", workers: 32, status: "active", color: "bg-green-500" },
  { location: "Brisbane Office", workers: 28, status: "active", color: "bg-blue-500" },
  { location: "Perth Office", workers: 18, status: "active", color: "bg-blue-500" },
  { location: "Adelaide Office", workers: 15, status: "active", color: "bg-orange-500" },
  { location: "Remote Workers", workers: 18, status: "remote", color: "bg-purple-500" },
];

const jobCards = [
  {
    id: "JOB-2024-001",
    title: "Commercial Building Renovation",
    client: "ABC Constructions Pty Ltd",
    status: "in-progress",
    priority: "high",
    progress: 65,
    deadline: "2024-11-15",
    assignedWorkers: ["JD", "SM", "RK"],
    budget: "$125,000",
    location: "Sydney",
  },
  {
    id: "JOB-2024-002",
    title: "Warehouse Electrical Installation",
    client: "Metro Logistics Group",
    status: "in-progress",
    priority: "medium",
    progress: 40,
    deadline: "2024-11-28",
    assignedWorkers: ["AL", "BT"],
    budget: "$85,000",
    location: "Melbourne",
  },
  {
    id: "JOB-2024-003",
    title: "Residential Solar Panel Setup",
    client: "Green Energy Solutions",
    status: "pending",
    priority: "low",
    progress: 15,
    deadline: "2024-12-10",
    assignedWorkers: ["MJ"],
    budget: "$45,000",
    location: "Brisbane",
  },
  {
    id: "JOB-2024-004",
    title: "Office HVAC System Upgrade",
    client: "TechCorp Industries",
    status: "in-progress",
    priority: "high",
    progress: 80,
    deadline: "2024-11-08",
    assignedWorkers: ["PK", "DN", "FM", "LS"],
    budget: "$95,000",
    location: "Perth",
  },
];

export default function Dashboard() {
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
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Workers Location Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workerLocations.map((location) => (
              <div key={location.location} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
                <div className={`h-3 w-3 rounded-full ${location.color} animate-pulse`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{location.location}</p>
                  <p className="text-xs text-muted-foreground">{location.workers} workers</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {location.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Active Job Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jobCards.map((job) => (
              <Card key={job.id} className="border-l-4 border-l-primary hover:shadow-lg transition-all">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-muted-foreground">{job.id}</p>
                      <h3 className="font-semibold text-base leading-tight">{job.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {job.client}
                      </p>
                    </div>
                    <Badge 
                      variant={job.priority === "high" ? "destructive" : job.priority === "medium" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {job.priority}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(job.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {job.status === "in-progress" ? "In Progress" : "Pending"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex -space-x-2">
                      {job.assignedWorkers.map((worker, idx) => (
                        <Avatar key={idx} className="h-7 w-7 border-2 border-background">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {worker}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-primary">{job.budget}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
