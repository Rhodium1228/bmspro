import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Eye, Trash2, User, Calendar as CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function JobWorkSchedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [availabilityDate, setAvailabilityDate] = useState<Date>();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [notes, setNotes] = useState("");
  const [viewingSchedule, setViewingSchedule] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

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
    setNotes("");
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create job work schedule
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
        }])
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      // Create job work schedule items
      const employee = employees.find((e: any) => e.id === selectedEmployee);
      const scheduleItems = orderItems.map(item => ({
        job_work_schedule_id: schedule.id,
        item_name: item.name || item.item_name || "Unnamed Item",
        quantity: item.quantity || 1,
        unit: item.unit || "unit",
        availability_date: format(availabilityDate, "yyyy-MM-dd"),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Work Schedule</h1>
          <p className="text-muted-foreground">Create and manage job work schedules from purchase orders</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>

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
                    <TableCell colSpan={7} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No job work schedules found. Create one from a purchase order.
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule: any) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.order_number}</TableCell>
                      <TableCell>{schedule.supplier_name}</TableCell>
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

      {/* Create Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Job Work Schedule</DialogTitle>
          </DialogHeader>
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
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            <span className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              {emp.name} - {emp.designation}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                {viewingSchedule.notes && (
                  <div className="mt-2">
                    <span className="text-muted-foreground">Notes:</span>{" "}
                    <p className="text-sm mt-1">{viewingSchedule.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Assigned Tasks</h3>
                {viewingSchedule.job_work_schedule_items?.map((item: any) => (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} {item.unit || "unit"}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            item.status === "completed" ? "default" : 
                            item.status === "in-progress" ? "secondary" : 
                            "outline"
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Availability:</span>{" "}
                          <span>{new Date(item.availability_date).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Assigned to:</span>{" "}
                          <span>{item.assigned_employee_name}</span>
                        </div>
                      </div>
                      {item.status !== "completed" && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemStatus(item.id, "in-progress")}
                          >
                            Mark In Progress
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateItemStatus(item.id, "completed")}
                          >
                            Mark Completed
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
