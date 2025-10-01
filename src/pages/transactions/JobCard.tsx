import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2,
  Briefcase,
  Calendar,
  MapPin,
} from "lucide-react";

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

export default function JobCard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Cards</h1>
        <p className="text-muted-foreground">Manage and track all your active job cards</p>
      </div>

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
    </div>
  );
}
