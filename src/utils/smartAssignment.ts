import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  name: string;
  skills: string[];
  is_available: boolean;
  available_dates: Record<string, boolean>;
  hourly_rate: number;
}

interface Task {
  item_name: string;
  quantity: number;
  availability_date: string;
  skills_required?: string[];
  estimated_hours?: number;
  priority?: string;
}

export const findBestEmployee = async (
  task: Task,
  employees: Employee[]
): Promise<{ employeeId: string; score: number; reason: string } | null> => {
  const availableEmployees = employees.filter((emp) => emp.is_available);

  if (availableEmployees.length === 0) {
    return null;
  }

  const scores = availableEmployees.map((employee) => {
    let score = 0;
    const reasons: string[] = [];

    // Skill matching (40 points max)
    if (task.skills_required && task.skills_required.length > 0) {
      const matchedSkills = task.skills_required.filter((skill) =>
        employee.skills?.includes(skill)
      );
      const skillScore = (matchedSkills.length / task.skills_required.length) * 40;
      score += skillScore;
      if (matchedSkills.length > 0) {
        reasons.push(`Matches ${matchedSkills.length} required skills`);
      }
    } else {
      score += 20; // Base score if no specific skills required
    }

    // Date availability (30 points max)
    const taskDate = new Date(task.availability_date).toISOString().split("T")[0];
    if (employee.available_dates && employee.available_dates[taskDate]) {
      score += 30;
      reasons.push("Available on task date");
    }

    // Cost efficiency (20 points max - inverse of rate)
    if (employee.hourly_rate) {
      const maxRate = Math.max(...employees.map((e) => e.hourly_rate || 0));
      const rateScore = maxRate > 0 ? ((maxRate - employee.hourly_rate) / maxRate) * 20 : 0;
      score += rateScore;
      reasons.push(`Cost-effective rate: $${employee.hourly_rate}/hr`);
    }

    // Priority bonus (10 points)
    if (task.priority === "high") {
      score += 10;
      reasons.push("High priority task");
    }

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      score,
      reason: reasons.join(", "),
    };
  });

  scores.sort((a, b) => b.score - a.score);

  return scores[0] || null;
};

export const createNotification = async (
  userId: string,
  employeeId: string | null,
  title: string,
  message: string,
  type: string = "info",
  metadata: any = {}
) => {
  const { error } = await supabase.from("notifications" as any).insert([
    {
      user_id: userId,
      employee_id: employeeId,
      title,
      message,
      type,
      metadata,
      is_read: false,
    } as any,
  ]);

  if (error) {
    console.error("Error creating notification:", error);
  }
};

export const checkEmployeeWorkload = async (
  employeeId: string,
  dateRange: { start: Date; end: Date }
): Promise<number> => {
  const { data, error } = await supabase
    .from("job_work_schedule_items" as any)
    .select("estimated_hours")
    .eq("assigned_employee_id", employeeId)
    .gte("availability_date", dateRange.start.toISOString())
    .lte("availability_date", dateRange.end.toISOString())
    .neq("status", "completed");

  if (error) {
    console.error("Error checking workload:", error);
    return 0;
  }

  return data.reduce((total: number, item: any) => total + (item.estimated_hours || 0), 0);
};
