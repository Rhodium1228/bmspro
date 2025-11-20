import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SmartEmployeeSelector } from "@/components/SmartEmployeeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const taskFormSchema = z.object({
  item_name: z.string().min(1, "Task name is required").max(200),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unit: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  due_date: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  assigned_employee_id: z.string().optional(),
  task_lead_id: z.string().optional(),
  parent_task_id: z.string().optional(),
  skills_required: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TaskFormValues & { task_type: "parent" | "subtask" }) => void;
  scheduleId: string;
  parentTasks: Array<{ id: string; item_name: string }>;
  initialValues?: Partial<TaskFormValues> & { task_type?: "parent" | "subtask" };
  mode: "create" | "edit";
}

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  scheduleId,
  parentTasks,
  initialValues,
  mode,
}: TaskFormDialogProps) {
  const [taskType, setTaskType] = useState<"parent" | "subtask">(
    initialValues?.task_type || initialValues?.parent_task_id ? "subtask" : "parent"
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      item_name: "",
      quantity: 1,
      unit: "unit",
      priority: "medium",
      estimated_hours: 0,
      skills_required: [],
      ...initialValues,
    },
  });

  useEffect(() => {
    if (open && initialValues) {
      form.reset({
        item_name: "",
        quantity: 1,
        unit: "unit",
        priority: "medium",
        estimated_hours: 0,
        skills_required: [],
        ...initialValues,
      });
      setTaskType(initialValues.task_type || initialValues.parent_task_id ? "subtask" : "parent");
    }
  }, [open, initialValues, form]);

  const handleSubmit = (values: TaskFormValues) => {
    onSubmit({ ...values, task_type: taskType });
    form.reset();
  };

  const availableSkills = [
    "Installation",
    "Configuration",
    "Testing",
    "Documentation",
    "Electrical Work",
    "Network Setup",
    "Programming",
    "Troubleshooting",
  ];

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialValues?.skills_required || []
  );

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    form.setValue("skills_required", selectedSkills);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Task Type Selection (only in create mode) */}
            {mode === "create" && !initialValues?.parent_task_id && (
              <Tabs value={taskType} onValueChange={(v) => setTaskType(v as "parent" | "subtask")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="parent">Parent Task</TabsTrigger>
                  <TabsTrigger value="subtask">Sub-Task</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Parent Task Selection (for sub-tasks) */}
            {taskType === "subtask" && (
              <FormField
                control={form.control}
                name="parent_task_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Task *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent task" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parentTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.item_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="item_name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Task Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., units, hours" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Task Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Skills Required */}
            <FormItem>
              <FormLabel>Skills Required</FormLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant={selectedSkills.includes(skill) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </FormItem>

            {/* Employee Assignment */}
            {taskType === "parent" ? (
              <FormField
                control={form.control}
                name="task_lead_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Lead (Optional)</FormLabel>
                    <FormControl>
                      <SmartEmployeeSelector
                        value={field.value || ""}
                        onChange={field.onChange}
                        date={form.watch("due_date") ? new Date(form.watch("due_date")) : undefined}
                        skillsRequired={selectedSkills}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="assigned_employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <FormControl>
                      <SmartEmployeeSelector
                        value={field.value || ""}
                        onChange={field.onChange}
                        date={form.watch("due_date") ? new Date(form.watch("due_date")) : undefined}
                        skillsRequired={selectedSkills}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or instructions"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === "edit" ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
