import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Search, Eye } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const PurchaseOrder = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [orderNumber, setOrderNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [quotationId, setQuotationId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [poApprovedNote, setPoApprovedNote] = useState("");
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch purchase orders (API: GetPurchaseQuotationList)
  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          quotations (
            quotation_number,
            customer_name,
            total
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch quotations for dropdown
  const { data: quotations = [] } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("id, quotation_number, customer_name, total")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const resetForm = () => {
    setOrderNumber("");
    setSupplierName("");
    setOrderDate("");
    setDeliveryDate("");
    setTotalAmount("");
    setStatus("pending");
    setNotes("");
    setQuotationId("");
    setPoNumber("");
    setPoDate("");
    setPoApprovedNote("");
    setEditingId(null);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const purchaseOrderData = {
        order_number: orderNumber,
        supplier_name: supplierName,
        order_date: orderDate,
        delivery_date: deliveryDate,
        total_amount: parseFloat(totalAmount),
        status,
        notes,
        quotation_id: quotationId || null,
        po_number: poNumber || null,
        po_date: poDate || null,
        po_approved_note: poApprovedNote || null,
        user_id: user.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("purchase_orders")
          .update(purchaseOrderData)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Purchase order updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("purchase_orders")
          .insert([purchaseOrderData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Purchase order created successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      handleDialogChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (order: any) => {
    setEditingId(order.id);
    setOrderNumber(order.order_number);
    setSupplierName(order.supplier_name);
    setOrderDate(order.order_date);
    setDeliveryDate(order.delivery_date);
    setTotalAmount(order.total_amount.toString());
    setStatus(order.status);
    setNotes(order.notes || "");
    setQuotationId(order.quotation_id || "");
    setPoNumber(order.po_number || "");
    setPoDate(order.po_date || "");
    setPoApprovedNote(order.po_approved_note || "");
    setIsDialogOpen(true);
  };

  const handleView = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          quotations (
            quotation_number,
            customer_name,
            total,
            items,
            quotation_date
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setViewingOrder(data);
      setIsViewDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdatePO = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!viewingOrder) return;

    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({
          po_number: poNumber,
          po_date: poDate,
          po_approved_note: poApprovedNote,
        })
        .eq("id", viewingOrder.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "PO details updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      setIsViewDialogOpen(false);
      setViewingOrder(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) return;

    try {
      const { error } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredOrders = purchaseOrders.filter((order) =>
    order.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Purchase Orders</CardTitle>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by supplier name or order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.supplier_name}</TableCell>
                      <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(order.delivery_date).toLocaleDateString()}</TableCell>
                      <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(order.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Purchase Order" : "New Purchase Order"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quotation">Link to Quotation (Optional)</Label>
              <Select value={quotationId} onValueChange={setQuotationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a quotation" />
                </SelectTrigger>
                <SelectContent>
                  {quotations.map((q: any) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.quotation_number} - {q.customer_name} (${q.total})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">Order Number *</Label>
                <Input
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name *</Label>
                <Input
                  id="supplierName"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date *</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poDate">PO Date</Label>
                <Input
                  id="poDate"
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poApprovedNote">PO Approved Note</Label>
              <Textarea
                id="poApprovedNote"
                value={poApprovedNote}
                onChange={(e) => setPoApprovedNote(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View/Update PO Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details & PO Update</DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Order Number</Label>
                  <p className="font-medium">{viewingOrder.order_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Supplier</Label>
                  <p className="font-medium">{viewingOrder.supplier_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p>{new Date(viewingOrder.order_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Delivery Date</Label>
                  <p>{new Date(viewingOrder.delivery_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <p className="font-medium">${viewingOrder.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium capitalize">{viewingOrder.status}</p>
                </div>
              </div>

              {viewingOrder.quotations && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Linked Quotation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Quotation Number</Label>
                      <p>{viewingOrder.quotations.quotation_number}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Quotation Total</Label>
                      <p>${viewingOrder.quotations.total}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleUpdatePO} className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Update PO Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="viewPoNumber">PO Number *</Label>
                    <Input
                      id="viewPoNumber"
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder={viewingOrder.po_number || "Enter PO number"}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="viewPoDate">PO Date *</Label>
                    <Input
                      id="viewPoDate"
                      type="date"
                      value={poDate}
                      onChange={(e) => setPoDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="viewPoApprovedNote">PO Approved Note</Label>
                  <Textarea
                    id="viewPoApprovedNote"
                    value={poApprovedNote}
                    onChange={(e) => setPoApprovedNote(e.target.value)}
                    placeholder={viewingOrder.po_approved_note || "Optional note"}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      setViewingOrder(null);
                      setPoNumber("");
                      setPoDate("");
                      setPoApprovedNote("");
                    }}
                  >
                    Close
                  </Button>
                  <Button type="submit">Update PO</Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrder;
