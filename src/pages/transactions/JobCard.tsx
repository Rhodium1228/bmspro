import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function JobCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [availabilityDate, setAvailabilityDate] = useState<Date>();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [notes, setNotes] = useState("");
  const [viewingJobCard, setViewingJobCard] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch sale orders
  const { data: saleOrders = [] } = useQuery({
    queryKey: ["saleOrders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("sale_orders")
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

  // Fetch job cards
  const { data: jobCards = [], isLoading } = useQuery({
    queryKey: ["jobCards"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_cards")
        .select(`
          *,
          job_card_items (
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
    const order = saleOrders.find((o: any) => o.id === orderId);
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
        description: "Please select a sale order",
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

      // Create job card
      const { data: jobCard, error: jobCardError } = await supabase
        .from("job_cards")
        .insert([{
          user_id: user.id,
          sale_order_id: selectedOrder.id,
          order_number: selectedOrder.order_number,
          customer_name: selectedOrder.customer_name,
          status: "pending",
          total_items: orderItems.length,
          completed_items: 0,
          notes,
        }])
        .select()
        .single();

      if (jobCardError) throw jobCardError;

      // Create job card items
      const employee = employees.find((e: any) => e.id === selectedEmployee);
      const jobCardItems = orderItems.map(item => ({
        job_card_id: jobCard.id,
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
        .from("job_card_items")
        .insert(jobCardItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Job card created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["jobCards"] });
      handleDialogChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleView = async (jobCardId: string) => {
    const jobCard = jobCards.find((jc: any) => jc.id === jobCardId);
    setViewingJobCard(jobCard);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job card?")) return;

    try {
      const { error } = await supabase
        .from("job_cards")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job card deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["jobCards"] });
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
        .from("job_card_items")
        .update({ status: newStatus })
        .eq("id", itemId);

      if (error) throw error;

      // Update job card completed count
      if (viewingJobCard) {
        const completedCount = viewingJobCard.job_card_items.filter(
          (item: any) => item.id === itemId ? newStatus === "completed" : item.status === "completed"
        ).length;

        await supabase
          .from("job_cards")
          .update({ 
            completed_items: completedCount,
            status: completedCount === viewingJobCard.total_items ? "completed" : "in-progress"
          })
          .eq("id", viewingJobCard.id);
      }

      toast({
        title: "Success",
        description: "Item status updated",
      });

      queryClient.invalidateQueries({ queryKey: ["jobCards"] });
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
          <h1 className="text-3xl font-bold tracking-tight">Job Cards</h1>
          <p className="text-muted-foreground">Create and manage job cards from sale orders</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Job Card
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Job Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
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
                ) : jobCards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No job cards found. Create one from a sale order.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobCards.map((jobCard: any) => (
                    <TableRow key={jobCard.id}>
                      <TableCell className="font-medium">{jobCard.order_number}</TableCell>
                      <TableCell>{jobCard.customer_name}</TableCell>
                      <TableCell>{jobCard.total_items}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {jobCard.completed_items}/{jobCard.total_items}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            jobCard.status === "completed" ? "default" : 
                            jobCard.status === "in-progress" ? "secondary" : 
                            "outline"
                          }
                        >
                          {jobCard.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(jobCard.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(jobCard.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(jobCard.id)}
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

      {/* Create Job Card Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Job Card</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="saleOrder">Select Sale Order *</Label>
              <Select value={selectedOrderId} onValueChange={handleOrderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sale order" />
                </SelectTrigger>
                <SelectContent>
                  {saleOrders.map((order: any) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number} - {order.customer_name}
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
                      <span className="text-muted-foreground">Customer:</span>{" "}
                      <span className="font-medium">{selectedOrder.customer_name}</span>
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
                    No items found in this sale order. Make sure the order is linked to a quotation with items.
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Job Card Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add general notes for this job card..."
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
                Create Job Card
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Job Card Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Card Details</DialogTitle>
          </DialogHeader>
          {viewingJobCard && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-medium">{viewingJobCard.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{viewingJobCard.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={viewingJobCard.status === "completed" ? "default" : "secondary"}>
                      {viewingJobCard.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="font-medium">
                      {viewingJobCard.completed_items}/{viewingJobCard.total_items} items
                    </p>
                  </div>
                  {viewingJobCard.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{viewingJobCard.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Assigned Tasks</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Availability Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingJobCard.job_card_items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground">{item.notes}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              {item.assigned_employee_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(item.availability_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "completed" ? "default" :
                                item.status === "in-progress" ? "secondary" :
                                "outline"
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.status}
                              onValueChange={(value) => updateItemStatus(item.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
