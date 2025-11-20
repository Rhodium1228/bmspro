import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Eye, Trash2, X, Calendar as CalendarIcon, FileText, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SmartEmployeeSelector } from "@/components/SmartEmployeeSelector";
import { JobScheduleCalendar } from "@/components/JobScheduleCalendar";
import { TaskHierarchyView } from "@/components/tasks/TaskHierarchyView";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";

interface ManualWorkItem {
  tempId: string;
  item_name: string;
  quantity: number;
  unit: string;
  due_date: Date | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  skills_required: string[];
  estimated_hours: number;
  assigned_employee_id: string;
  notes: string;
}

export default function JobWorkSchedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<'purchase-order' | 'manual'>('purchase-order');
  
  // Purchase Order Mode State
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [availabilityDate, setAvailabilityDate] = useState<Date>();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  
  // Manual Mode State
  const [manualJobName, setManualJobName] = useState("");
  const [manualClientName, setManualClientName] = useState("");
  const [manualStartDate, setManualStartDate] = useState<Date>();
  const [manualItems, setManualItems] = useState<ManualWorkItem[]>([{
    tempId: crypto.randomUUID(),
    item_name: "",
    quantity: 1,
    unit: "unit",
    due_date: null,
    priority: 'medium',
    skills_required: [],
    estimated_hours: 0,
    assigned_employee_id: "",
    notes: "",
  }]);
  
  // Common State
  const [notes, setNotes] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [viewingSchedule, setViewingSchedule] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Task Management State
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskDialogMode, setTaskDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [parentTaskIdForSubtask, setParentTaskIdForSubtask] = useState<string | null>(null);

  // Fetch purchase orders
  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          quotations (
            id,
            items,
            quotation_number
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch job work schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["jobWorkSchedules"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_work_schedules")
        .select(`
          *,
          job_work_schedule_items (
            *
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = purchaseOrders.find((o: any) => o.id === orderId);
    setSelectedOrder(order);

    if (order?.quotations?.items && Array.isArray(order.quotations.items)) {
      setOrderItems(order.quotations.items);
    } else {
      setOrderItems([]);
    }
  };

  const resetForm = () => {
    setSelectedOrderId("");
    setSelectedOrder(null);
    setOrderItems([]);
    setAvailabilityDate(undefined);
    setSelectedEmployee("");
    setManualJobName("");
    setManualClientName("");
    setManualStartDate(undefined);
    setManualItems([{
      tempId: crypto.randomUUID(),
      item_name: "",
      quantity: 1,
      unit: "unit",
      due_date: null,
      priority: 'medium',
      skills_required: [],
      estimated_hours: 0,
      assigned_employee_id: "",
      notes: "",
    }]);
    setNotes("");
    setSiteAddress("");
  };

  const addManualItem = () => {
    setManualItems([...manualItems, {
      tempId: crypto.randomUUID(),
      item_name: "",
      quantity: 1,
      unit: "unit",
      due_date: null,
      priority: 'medium',
      skills_required: [],
      estimated_hours: 0,
      assigned_employee_id: "",
      notes: "",
    }]);
  };

  const removeManualItem = (tempId: string) => {
    if (manualItems.length > 1) {
      setManualItems(manualItems.filter(item => item.tempId !== tempId));
    }
  };

  const updateManualItem = (tempId: string, field: keyof ManualWorkItem, value: any) => {
    setManualItems(manualItems.map(item => 
      item.tempId === tempId ? { ...item, [field]: value } : item
    ));
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for Manual Mode
    if (creationMode === 'manual') {
      if (!manualJobName.trim()) {
        toast({
          title: "Error",
          description: "Please enter a job name",
          variant: "destructive",
        });
        return;
      }

      if (!manualClientName.trim()) {
        toast({
          title: "Error",
          description: "Please enter a client/customer name",
          variant: "destructive",
        });
        return;
      }

      if (!manualStartDate) {
        toast({
          title: "Error",
          description: "Please select a start date",
          variant: "destructive",
        });
        return;
      }

      if (manualItems.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one work item",
          variant: "destructive",
        });
        return;
      }

      // Validate each manual item
      for (const item of manualItems) {
        if (!item.item_name.trim()) {
          toast({
            title: "Error",
            description: "All items must have a name",
            variant: "destructive",
          });
          return;
        }
        if (!item.assigned_employee_id) {
          toast({
            title: "Error",
            description: `Please assign an employee to: ${item.item_name}`,
            variant: "destructive",
          });
          return;
        }
        if (!item.due_date) {
          toast({
            title: "Error",
            description: `Please set a due date for: ${item.item_name}`,
            variant: "destructive",
          });
          return;
        }
      }
    } else {
      // Validation for Purchase Order Mode
      if (!selectedOrder) {
        toast({
          title: "Error",
          description: "Please select a purchase order",
          variant: "destructive",
        });
        return;
      }

      if (orderItems.length === 0) {
        toast({
          title: "Error",
          description: "No items found in the selected order",
          variant: "destructive",
        });
        return;
      }

      if (!availabilityDate) {
        toast({
          title: "Error",
          description: "Please select availability date",
          variant: "destructive",
        });
        return;
      }

      if (!selectedEmployee) {
        toast({
          title: "Error",
          description: "Please select an employee",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      if (creationMode === 'manual') {
        // Manual Creation Flow
        const { data: schedule, error: scheduleError } = await supabase
          .from("job_work_schedules")
          .insert([{
            user_id: user.id,
            purchase_order_id: null,
            order_number: manualJobName,
            supplier_name: manualClientName,
            status: "pending",
            total_items: manualItems.length,
            completed_items: 0,
            notes,
            site_address: siteAddress,
          }])
          .select()
          .single();

        if (scheduleError) throw scheduleError;

        // Get employee names
        const employeeMap = new Map(
          employees.map((e: any) => [e.id, e.name])
        );

        // Create schedule items with per-item assignments
        const scheduleItems = manualItems.map(item => ({
          job_work_schedule_id: schedule.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          availability_date: format(manualStartDate!, "yyyy-MM-dd"),
          due_date: item.due_date ? format(item.due_date, "yyyy-MM-dd") : null,
          priority: item.priority,
          skills_required: item.skills_required,
          estimated_hours: item.estimated_hours || null,
          assigned_employee_id: item.assigned_employee_id,
          assigned_employee_name: employeeMap.get(item.assigned_employee_id) || "",
          status: "pending",
          notes: item.notes,
        }));

        const { error: itemsError } = await supabase
          .from("job_work_schedule_items")
          .insert(scheduleItems);

        if (itemsError) throw itemsError;

        toast({
          title: "Success",
          description: `Job work schedule created with ${manualItems.length} items`,
        });
      } else {
        // Purchase Order Creation Flow
        const { data: schedule, error: scheduleError } = await supabase
          .from("job_work_schedules")
          .insert([{
            user_id: user.id,
            purchase_order_id: selectedOrder.id,
            order_number: selectedOrder.order_number,
            supplier_name: selectedOrder.supplier_name,
            status: "pending",
            total_items: orderItems.length,
            completed_items: 0,
            notes,
            site_address: siteAddress,
          }])
          .select()
          .single();

        if (scheduleError) throw scheduleError;

        const employee = employees.find((e: any) => e.id === selectedEmployee);
        const scheduleItems = orderItems.map(item => ({
          job_work_schedule_id: schedule.id,
          item_name: item.name || item.item_name || "Unnamed Item",
          quantity: item.quantity || 1,
          unit: item.unit || "unit",
          availability_date: format(availabilityDate!, "yyyy-MM-dd"),
          assigned_employee_id: selectedEmployee,
          assigned_employee_name: employee?.name || "",
          status: "pending",
          notes: "",
        }));

        const { error: itemsError } = await supabase
          .from("job_work_schedule_items")
          .insert(scheduleItems);

        if (itemsError) throw itemsError;

        toast({
          title: "Success",
          description: "Job work schedule created successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["jobWorkSchedules"] });
      handleDialogChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleView = async (scheduleId: string) => {
    const schedule = schedules.find((s: any) => s.id === scheduleId);
    setViewingSchedule(schedule);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job work schedule?")) return;

    try {
      const { error } = await supabase
        .from("job_work_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job work schedule deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["jobWorkSchedules"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("job_work_schedule_items")
        .update({ status: newStatus })
        .eq("id", itemId);

      if (error) throw error;

      // Update schedule completed count
      if (viewingSchedule) {
        const completedCount = viewingSchedule.job_work_schedule_items.filter(
          (item: any) => item.id === itemId ? newStatus === "completed" : item.status === "completed"
        ).length;

        await supabase
          .from("job_work_schedules")
          .update({ 
            completed_items: completedCount,
            status: completedCount === viewingSchedule.total_items ? "completed" : "in-progress"
          })
          .eq("id", viewingSchedule.id);
      }

      toast({
        title: "Success",
        description: "Item status updated",
      });

      queryClient.invalidateQueries({ queryKey: ["jobWorkSchedules"] });
      setIsViewDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Task Management Handlers
  const handleAddTask = () => {
    if (!viewingSchedule) return;
    setTaskDialogMode('create');
    setSelectedTask(null);
    setParentTaskIdForSubtask(null);
    setIsTaskDialogOpen(true);
  };

  const handleAddSubTask = (parentTaskId: string) => {
    setTaskDialogMode('create');
    setSelectedTask(null);
    setParentTaskIdForSubtask(parentTaskId);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: any) => {
    setTaskDialogMode('edit');
    setSelectedTask(task);
    setParentTaskIdForSubtask(null);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const { error } = await supabase
        .from("job_work_schedule_items")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["jobWorkSchedules"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("job_work_schedule_items")
        .update({ status })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Task marked as ${status.replace("-", " ")}`,
      });

      queryClient.invalidateQueries({ queryKey: ["jobWorkSchedules"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTaskFormSubmit = async (values: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!viewingSchedule) throw new Error("No schedule selected");

      const taskData: any = {
        job_work_schedule_id: viewingSchedule.id,
        item_name: values.item_name,
        quantity: values.quantity,
        unit: values.unit || "unit",
        availability_date: values.due_date || new Date().toISOString().split('T')[0],
        due_date: values.due_date,
        priority: values.priority,
        estimated_hours: values.estimated_hours || 0,
        skills_required: values.skills_required || [],
        notes: values.notes || "",
        status: "pending",
        task_level: values.task_type === "subtask" ? 1 : 0,
        parent_task_id: values.task_type === "subtask" ? (values.parent_task_id || parentTaskIdForSubtask) : null,
        task_order: 0,
      };

      // Assign employee based on task type
      if (values.task_type === "parent" && values.task_lead_id) {
        taskData.task_lead_id = values.task_lead_id;
      } else if (values.assigned_employee_id) {
        taskData.assigned_employee_id = values.assigned_employee_id;
        const employee = employees.find((e: any) => e.id === values.assigned_employee_id);
        if (employee) {
          taskData.assigned_employee_name = employee.name;
        }
      }

      if (taskDialogMode === 'edit' && selectedTask) {
        const { error } = await supabase
          .from("job_work_schedule_items")
          .update(taskData)
          .eq("id", selectedTask.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("job_work_schedule_items")
          .insert([taskData]);

        if (error) throw error;

        // Update total_items count
        await supabase
          .from("job_work_schedules")
          .update({ total_items: viewingSchedule.total_items + 1 })
          .eq("id", viewingSchedule.id);

        toast({
          title: "Success",
          description: "Task created successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["jobWorkSchedules"] });
      setIsTaskDialogOpen(false);
      setSelectedTask(null);
      setParentTaskIdForSubtask(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Work Schedule</h1>
          <p className="text-muted-foreground">Create and manage job work schedules from purchase orders or manually with per-item employee assignment</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Schedule
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <JobScheduleCalendar />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Job Work Schedules</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Site Address</TableHead>
                  <TableHead>Total Items</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No job work schedules found. Create one from a purchase order.
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule: any) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.order_number}</TableCell>
                      <TableCell>{schedule.supplier_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{schedule.site_address || "-"}</TableCell>
                      <TableCell>{schedule.total_items}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {schedule.completed_items}/{schedule.total_items}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            schedule.status === "completed" ? "default" : 
                            schedule.status === "in-progress" ? "secondary" : 
                            "outline"
                          }
                        >
                          {schedule.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(schedule.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(schedule.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Create Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Job Work Schedule</DialogTitle>
          </DialogHeader>

          <Tabs value={creationMode} onValueChange={(v) => setCreationMode(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="purchase-order">From Purchase Order</TabsTrigger>
              <TabsTrigger value="manual">Manual Creation</TabsTrigger>
            </TabsList>

            <TabsContent value="purchase-order" className="space-y-4 mt-4">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseOrder">Select Purchase Order *</Label>
                  <Select value={selectedOrderId} onValueChange={handleOrderChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a purchase order" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrders.map((order: any) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.order_number} - {order.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedOrder && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Order Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Supplier:</span>{" "}
                          <span className="font-medium">{selectedOrder.supplier_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Order Date:</span>{" "}
                          <span className="font-medium">
                            {new Date(selectedOrder.order_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Delivery Date:</span>{" "}
                          <span className="font-medium">
                            {new Date(selectedOrder.delivery_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Amount:</span>{" "}
                          <span className="font-medium">${selectedOrder.total_amount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Availability Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !availabilityDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {availabilityDate ? (
                                format(availabilityDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={availabilityDate}
                              onSelect={setAvailabilityDate}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Assign Employee *</Label>
                        <SmartEmployeeSelector
                          value={selectedEmployee}
                          onChange={setSelectedEmployee}
                          date={availabilityDate}
                        />
                      </div>
                    </div>

                    {orderItems.length > 0 ? (
                      <div className="space-y-2">
                        <Label>Items in Order ({orderItems.length})</Label>
                        <div className="rounded-lg border max-h-[200px] overflow-y-auto">
                          {orderItems.map((item, index) => (
                            <div key={index} className="p-3 border-b last:border-b-0">
                              <p className="font-medium">
                                {item.name || item.item_name || "Unnamed Item"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} {item.unit || "unit"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No items found in this purchase order. Make sure the order is linked to a quotation with items.
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="siteAddressPO">Site Address</Label>
                      <Textarea
                        id="siteAddressPO"
                        value={siteAddress}
                        onChange={(e) => setSiteAddress(e.target.value)}
                        placeholder="Enter the site/project address..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Schedule Notes</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add general notes for this job work schedule..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedOrder || orderItems.length === 0}>
                    Create Schedule
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Job Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobName">Job Name *</Label>
                      <Input
                        id="jobName"
                        value={manualJobName}
                        onChange={(e) => setManualJobName(e.target.value)}
                        placeholder="e.g., Office Security Installation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client/Customer *</Label>
                      <Input
                        id="clientName"
                        value={manualClientName}
                        onChange={(e) => setManualClientName(e.target.value)}
                        placeholder="e.g., ABC Corporation"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !manualStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {manualStartDate ? format(manualStartDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={manualStartDate}
                          onSelect={setManualStartDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="siteAddressManual">Site Address</Label>
                    <Textarea
                      id="siteAddressManual"
                      value={siteAddress}
                      onChange={(e) => setSiteAddress(e.target.value)}
                      placeholder="Enter the site/project address..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="jobNotes">Job Notes</Label>
                    <Textarea
                      id="jobNotes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Overall job notes..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Work Items ({manualItems.length})</Label>
                    <Button type="button" size="sm" onClick={addManualItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {manualItems.map((item, index) => (
                      <Card key={item.tempId} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary">Item {index + 1}</Badge>
                            {manualItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeManualItem(item.tempId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2 col-span-2">
                              <Label>Item Name *</Label>
                              <Input
                                value={item.item_name}
                                onChange={(e) => updateManualItem(item.tempId, 'item_name', e.target.value)}
                                placeholder="e.g., Install CCTV cameras"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Quantity *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateManualItem(item.tempId, 'quantity', parseFloat(e.target.value))}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Unit</Label>
                              <Input
                                value={item.unit}
                                onChange={(e) => updateManualItem(item.tempId, 'unit', e.target.value)}
                                placeholder="e.g., units, hours"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Due Date *</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !item.due_date && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {item.due_date ? format(item.due_date, "PPP") : <span>Pick date</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={item.due_date || undefined}
                                    onSelect={(date) => updateManualItem(item.tempId, 'due_date', date)}
                                    initialFocus
                                    className="pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="space-y-2">
                              <Label>Priority</Label>
                              <Select
                                value={item.priority}
                                onValueChange={(v) => updateManualItem(item.tempId, 'priority', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Estimated Hours</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={item.estimated_hours}
                                onChange={(e) => updateManualItem(item.tempId, 'estimated_hours', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Skills Required (comma separated)</Label>
                              <Input
                                value={item.skills_required.join(', ')}
                                onChange={(e) => updateManualItem(
                                  item.tempId, 
                                  'skills_required', 
                                  e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                )}
                                placeholder="e.g., Electrical, Installation"
                              />
                            </div>

                            <div className="space-y-2 col-span-2">
                              <Label>Assign Employee *</Label>
                              <SmartEmployeeSelector
                                value={item.assigned_employee_id}
                                onChange={(v) => updateManualItem(item.tempId, 'assigned_employee_id', v)}
                                date={item.due_date || undefined}
                                skillsRequired={item.skills_required}
                              />
                            </div>

                            <div className="space-y-2 col-span-2">
                              <Label>Item Notes</Label>
                              <Textarea
                                value={item.notes}
                                onChange={(e) => updateManualItem(item.tempId, 'notes', e.target.value)}
                                placeholder="Specific notes for this task..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Job Schedule
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View Schedule Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Work Schedule Details</DialogTitle>
          </DialogHeader>
          {viewingSchedule && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Schedule Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order Number:</span>{" "}
                    <span className="font-medium">{viewingSchedule.order_number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Supplier:</span>{" "}
                    <span className="font-medium">{viewingSchedule.supplier_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <Badge 
                      variant={
                        viewingSchedule.status === "completed" ? "default" : 
                        viewingSchedule.status === "in-progress" ? "secondary" : 
                        "outline"
                      }
                    >
                      {viewingSchedule.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Progress:</span>{" "}
                    <span className="font-medium">
                      {viewingSchedule.completed_items}/{viewingSchedule.total_items}
                    </span>
                  </div>
                </div>
                {viewingSchedule.site_address && (
                  <div className="mt-3">
                    <span className="text-muted-foreground">Site Address:</span>{" "}
                    <p className="text-sm mt-1">{viewingSchedule.site_address}</p>
                  </div>
                )}
                {viewingSchedule.notes && (
                  <div className="mt-2">
                    <span className="text-muted-foreground">Notes:</span>{" "}
                    <p className="text-sm mt-1">{viewingSchedule.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Tasks & Sub-Tasks</h3>
                  <Button onClick={handleAddTask} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>

                <TaskHierarchyView
                  tasks={viewingSchedule.job_work_schedule_items || []}
                  onAddSubTask={handleAddSubTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateStatus={handleUpdateTaskStatus}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Task Form Dialog */}
      {viewingSchedule && (
        <TaskFormDialog
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          onSubmit={handleTaskFormSubmit}
          scheduleId={viewingSchedule.id}
          parentTasks={viewingSchedule.job_work_schedule_items?.filter((t: any) => !t.parent_task_id) || []}
          initialValues={
            selectedTask
              ? {
                  ...selectedTask,
                  task_type: selectedTask.parent_task_id ? 'subtask' : 'parent',
                }
              : parentTaskIdForSubtask
              ? { parent_task_id: parentTaskIdForSubtask, task_type: 'subtask' }
              : undefined
          }
          mode={taskDialogMode}
        />
      )}
    </div>
  );
}
