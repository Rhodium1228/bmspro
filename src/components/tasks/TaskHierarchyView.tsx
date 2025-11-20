import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, MoreVertical, Circle, Clock, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TaskItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  assigned_employee_name: string | null;
  assigned_employee_id: string | null;
  task_lead_id: string | null;
  parent_task_id: string | null;
  task_level: number;
  is_parent_task: boolean;
  completion_percentage: number | null;
  skills_required: any;
  notes: string | null;
}

interface TaskHierarchyViewProps {
  tasks: TaskItem[];
  onAddSubTask: (parentTaskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: string) => void;
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  "in-progress": "bg-blue-500/10 text-blue-700 border-blue-500/20",
  completed: "bg-green-500/10 text-green-700 border-green-500/20",
  blocked: "bg-red-500/10 text-red-700 border-red-500/20",
};

const priorityColors = {
  low: "text-slate-600",
  medium: "text-yellow-600",
  high: "text-orange-600",
  critical: "text-red-600",
};

export function TaskHierarchyView({
  tasks,
  onAddSubTask,
  onEditTask,
  onDeleteTask,
  onUpdateStatus,
}: TaskHierarchyViewProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Organize tasks into parent-child structure
  const parentTasks = tasks.filter((t) => !t.parent_task_id);
  const getSubTasks = (parentId: string) =>
    tasks.filter((t) => t.parent_task_id === parentId);

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const renderTask = (task: TaskItem, level: number = 0) => {
    const isExpanded = expandedTasks.has(task.id);
    const subTasks = getSubTasks(task.id);
    const hasSubTasks = task.is_parent_task || subTasks.length > 0;

    return (
      <Collapsible
        key={task.id}
        open={isExpanded}
        onOpenChange={() => toggleExpand(task.id)}
      >
        <div
          className={cn(
            "border-b border-border/50 hover:bg-muted/30 transition-colors",
            level > 0 && "bg-muted/10"
          )}
          style={{ paddingLeft: `${level * 2}rem` }}
        >
          <div className="flex items-center gap-3 p-4">
            {/* Expand/Collapse Button */}
            <div className="w-6 flex items-center justify-center">
              {hasSubTasks && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>

            {/* Task Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  "font-medium truncate",
                  task.is_parent_task && "font-semibold text-base"
                )}>
                  {task.item_name}
                </h4>
                {task.is_parent_task && (
                  <Badge variant="outline" className="text-xs">
                    {subTasks.length} {subTasks.length === 1 ? "subtask" : "subtasks"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Circle className="h-3 w-3" />
                  {task.quantity} {task.unit || "units"}
                </span>
                {task.estimated_hours && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.estimated_hours}h
                  </span>
                )}
                {task.assigned_employee_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {task.assigned_employee_name}
                  </span>
                )}
              </div>
            </div>

            {/* Priority Badge */}
            {task.priority && (
              <div className={cn("flex items-center gap-1", priorityColors[task.priority as keyof typeof priorityColors])}>
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-medium capitalize">{task.priority}</span>
              </div>
            )}

            {/* Due Date */}
            {task.due_date && (
              <div className="text-sm text-muted-foreground">
                {format(new Date(task.due_date), "MMM dd, yyyy")}
              </div>
            )}

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={cn("min-w-[100px] justify-center", statusColors[task.status as keyof typeof statusColors])}
            >
              {task.status.replace("-", " ")}
            </Badge>

            {/* Completion Percentage */}
            {task.is_parent_task && task.completion_percentage !== null && (
              <div className="text-sm font-medium text-primary">
                {Math.round(task.completion_percentage)}%
              </div>
            )}

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditTask(task)}>
                  Edit Task
                </DropdownMenuItem>
                {task.is_parent_task && (
                  <DropdownMenuItem onClick={() => onAddSubTask(task.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sub-Task
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(task.id, "in-progress")}
                  disabled={task.status === "in-progress"}
                >
                  Mark In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(task.id, "completed")}
                  disabled={task.status === "completed"}
                >
                  Mark Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteTask(task.id)}
                  className="text-destructive"
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Sub-tasks */}
        {hasSubTasks && (
          <CollapsibleContent>
            {subTasks.map((subTask) => renderTask(subTask, level + 1))}
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No tasks found. Create your first task to get started.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 border-b px-4 py-3 font-medium text-sm flex items-center gap-3">
        <div className="w-6"></div>
        <div className="flex-1">Task Name</div>
        <div className="w-24">Priority</div>
        <div className="w-32">Due Date</div>
        <div className="w-[100px]">Status</div>
        <div className="w-16">Progress</div>
        <div className="w-10"></div>
      </div>

      {/* Task List */}
      {parentTasks.map((task) => renderTask(task))}
    </div>
  );
}
