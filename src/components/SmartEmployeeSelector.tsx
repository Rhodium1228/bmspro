import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SmartEmployeeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  date?: Date;
  skillsRequired?: string[];
  className?: string;
}

interface EmployeeWithScore {
  id: string;
  name: string;
  designation: string;
  skills: string[];
  hourly_rate: number | null;
  is_available: boolean;
  skillMatch: number;
  workload: number;
  availabilityStatus: 'available' | 'partial' | 'unavailable';
}

export function SmartEmployeeSelector({ 
  value, 
  onChange, 
  date, 
  skillsRequired = [],
  className 
}: SmartEmployeeSelectorProps) {
  
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
  });

  const { data: workloadData = {} } = useQuery({
    queryKey: ["employeeWorkload", date],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_work_schedule_items")
        .select(`
          assigned_employee_id,
          status,
          job_work_schedule_id (
            user_id
          )
        `)
        .neq("status", "completed");

      if (error) throw error;

      const workload: Record<string, number> = {};
      data?.forEach((item: any) => {
        if (item.job_work_schedule_id?.user_id === user.id) {
          workload[item.assigned_employee_id] = (workload[item.assigned_employee_id] || 0) + 1;
        }
      });

      return workload;
    },
    enabled: !!date,
  });

  const scoredEmployees: EmployeeWithScore[] = useMemo(() => {
    return employees.map((emp: any) => {
      const empSkills = Array.isArray(emp.skills) ? emp.skills : [];
      const matchedSkills = skillsRequired.filter(skill => 
        empSkills.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))
      );
      const skillMatch = skillsRequired.length > 0 
        ? (matchedSkills.length / skillsRequired.length) * 100 
        : 100;

      const workload = workloadData[emp.id] || 0;
      
      // Check availability on specific date
      let availabilityStatus: 'available' | 'partial' | 'unavailable' = 'available';
      if (!emp.is_available) {
        availabilityStatus = 'unavailable';
      } else if (workload > 3) {
        availabilityStatus = 'partial';
      }

      return {
        id: emp.id,
        name: emp.name,
        designation: emp.designation,
        skills: empSkills,
        hourly_rate: emp.hourly_rate,
        is_available: emp.is_available,
        skillMatch,
        workload,
        availabilityStatus,
      };
    }).sort((a, b) => {
      // Sort by skill match first, then availability, then workload
      if (Math.abs(a.skillMatch - b.skillMatch) > 5) {
        return b.skillMatch - a.skillMatch;
      }
      const availabilityOrder = { available: 0, partial: 1, unavailable: 2 };
      if (a.availabilityStatus !== b.availabilityStatus) {
        return availabilityOrder[a.availabilityStatus] - availabilityOrder[b.availabilityStatus];
      }
      return a.workload - b.workload;
    });
  }, [employees, skillsRequired, workloadData]);

  const getAvailabilityIcon = (status: 'available' | 'partial' | 'unavailable') => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'partial':
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case 'unavailable':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
    }
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select employee" />
      </SelectTrigger>
      <SelectContent>
        <TooltipProvider>
          {scoredEmployees.map((emp) => (
            <SelectItem key={emp.id} value={emp.id}>
              <div className="flex items-center gap-2 w-full">
                <div className="flex items-center gap-1 flex-1">
                  {getAvailabilityIcon(emp.availabilityStatus)}
                  <span className="font-medium">{emp.name}</span>
                  <span className="text-muted-foreground text-xs">- {emp.designation}</span>
                </div>
                <div className="flex items-center gap-1">
                  {skillsRequired.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge 
                          variant={emp.skillMatch >= 80 ? "default" : emp.skillMatch >= 50 ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {Math.round(emp.skillMatch)}% match
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Skill Match: {Math.round(emp.skillMatch)}%</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {emp.workload > 0 && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs">
                          {emp.workload} tasks
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Current workload: {emp.workload} active tasks</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {emp.hourly_rate && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs flex items-center gap-0.5">
                          <DollarSign className="h-2.5 w-2.5" />
                          {emp.hourly_rate}/hr
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Hourly rate: ${emp.hourly_rate}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </TooltipProvider>
      </SelectContent>
    </Select>
  );
}
