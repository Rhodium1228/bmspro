import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileEdit, Wrench, Eye, Mail, Calculator, Trash2, Send, Search, UserPlus, Check, Download, List, CheckCircle2, XCircle, FileText, Paperclip } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface QuotationItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  rate: number;
  gst: number;
  discount: number;
  amount: number;
  datasheetUrl?: string;
}

export default function Quotation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<QuotationItem[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const [currentQuotationId, setCurrentQuotationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done">("all");
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  
  // Quotation details
  const [quotationNumber, setQuotationNumber] = useState(`QUO-${Date.now().toString().slice(-6)}`);
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<"cash" | "online">("cash");
  const [acsuPoints, setAcsuPoints] = useState(0);
  
  // Customer details
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  
  // Mock customer data - replace with actual data from backend
  const existingCustomers = [
    { id: "1", name: "John Doe", email: "john@example.com", phone: "+61 400 000 001", company: "ABC Corp" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", phone: "+61 400 000 002", company: "XYZ Ltd" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", phone: "+61 400 000 003", company: "Tech Solutions" },
  ];
  
  // Address
  const [address, setAddress] = useState("");
  
  // Terms and conditions
  const [termsAndConditions, setTermsAndConditions] = useState("");
  
  const [validUntil, setValidUntil] = useState("");
  const [taxRate, setTaxRate] = useState(18);
  const [discountRate, setDiscountRate] = useState(0);
  
  // New item form
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemRate, setNewItemRate] = useState(0);
  const [newItemGst, setNewItemGst] = useState(10);
  const [newItemDiscount, setNewItemDiscount] = useState(0);

  const addItem = () => {
    if (!newItemName || !newItemDesc || newItemQty <= 0 || newItemRate <= 0) {
      toast({
        title: "Invalid Item",
        description: "Please fill all item fields with valid values",
        variant: "destructive",
      });
      return;
    }

    const subtotal = newItemQty * newItemRate;
    const gstAmount = (subtotal * newItemGst) / 100;
    const discountAmount = (subtotal * newItemDiscount) / 100;
    const totalAmount = subtotal + gstAmount - discountAmount;

    // Find the selected item from master to get datasheet URL
    const selectedMasterItem = masterItems.find(item => item.item_name === newItemName);

    const newItem: QuotationItem = {
      id: Date.now().toString(),
      itemName: newItemName,
      description: newItemDesc,
      quantity: newItemQty,
      rate: newItemRate,
      gst: newItemGst,
      discount: newItemDiscount,
      amount: totalAmount,
      datasheetUrl: selectedMasterItem?.datasheet_url || undefined,
    };

    setItems([...items, newItem]);
    setNewItemName("");
    setNewItemDesc("");
    setNewItemQty(1);
    setNewItemRate(0);
    setNewItemGst(10);
    setNewItemDiscount(0);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const discountAmount = (subtotal * discountRate) / 100;
  const total = subtotal + taxAmount - discountAmount;

  // Fetch quotations
  const { data: quotations = [], isLoading: loadingQuotations } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch quotation settings
  const { data: quotationSettings } = useQuery({
    queryKey: ['quotation-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('quotation_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch items from master
  const { data: masterItems = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('item_name');

      if (error) throw error;
      return data;
    },
  });

  const saveQuotation = async () => {
    if (!customerName || items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add customer details and at least one item",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const quotationData = {
        user_id: user.id,
        quotation_number: quotationNumber,
        quotation_date: quotationDate,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        billing_address: address,
        shipping_address: address,
        payment_type: paymentType,
        items: items as any,
        subtotal: subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount_rate: discountRate,
        discount_amount: discountAmount,
        total: total,
        terms_conditions: termsAndConditions,
      };

      if (currentQuotationId) {
        const { error } = await supabase
          .from('quotations')
          .update(quotationData)
          .eq('id', currentQuotationId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Quotation updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('quotations')
          .insert(quotationData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Quotation saved successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save quotation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadQuotation = (quotation: any) => {
    setCurrentQuotationId(quotation.id);
    setQuotationNumber(quotation.quotation_number);
    setQuotationDate(quotation.quotation_date);
    setPaymentType(quotation.payment_type);
    setCustomerName(quotation.customer_name);
    setCustomerEmail(quotation.customer_email || "");
    setCustomerPhone(quotation.customer_phone || "");
    setAddress(quotation.billing_address || "");
    setTermsAndConditions(quotation.terms_conditions || "");
    setTaxRate(quotation.tax_rate);
    setDiscountRate(quotation.discount_rate);
    setItems(quotation.items);

    toast({
      title: "Loaded",
      description: "Quotation loaded successfully",
    });
  };

  const deleteQuotation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Quotation deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quotation",
        variant: "destructive",
      });
    }
  };

  const toggleQuotationStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "sent" ? "unsent" : "sent";
      const { error } = await supabase
        .from('quotations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Updated",
        description: `Quotation marked as ${newStatus}`,
      });

      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update quotation status",
        variant: "destructive",
      });
    }
  };

  const toggleQuotationCompletion = async (id: string, currentCompletion: boolean) => {
    try {
      const { error } = await supabase
        .from('quotations')
        .update({ is_completed: !currentCompletion })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Updated",
        description: `Quotation marked as ${!currentCompletion ? "done" : "pending"}`,
      });

      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update quotation completion",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCurrentQuotationId(null);
    setQuotationNumber(`QUO-${Date.now().toString().slice(-6)}`);
    setQuotationDate(new Date().toISOString().split('T')[0]);
    setPaymentType("cash");
    setAcsuPoints(0);
    setSelectedCustomer("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerCompany("");
    setAddress("");
    setTermsAndConditions("");
    setValidUntil("");
    setTaxRate(18);
    setDiscountRate(0);
    setItems([]);
    setIsCreatingQuotation(true);
    setActiveTab("create");
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return;

    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your document...",
      });

      // Import required libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const { PDFDocument } = await import('pdf-lib');

      // Capture the preview as canvas
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Create initial PDF from canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Get the quotation PDF as ArrayBuffer
      const quotationPdfBytes = pdf.output('arraybuffer');

      // Create PDFDocument from the quotation
      const mergedPdf = await PDFDocument.load(quotationPdfBytes);

      // Get items with datasheets
      const itemsWithDatasheets = items.filter(item => item.datasheetUrl);

      if (itemsWithDatasheets.length > 0) {
        toast({
          title: "Merging Datasheets",
          description: `Adding ${itemsWithDatasheets.length} datasheet(s)...`,
        });

        // Fetch and merge each datasheet
        for (const item of itemsWithDatasheets) {
          if (!item.datasheetUrl) continue;

          try {
            const response = await fetch(item.datasheetUrl);
            if (!response.ok) continue;

            const datasheetBytes = await response.arrayBuffer();
            const datasheetPdf = await PDFDocument.load(datasheetBytes);

            // Copy all pages from datasheet to merged PDF
            const copiedPages = await mergedPdf.copyPages(
              datasheetPdf,
              datasheetPdf.getPageIndices()
            );

            copiedPages.forEach((page) => {
              mergedPdf.addPage(page);
            });
          } catch (error) {
            console.error(`Error loading datasheet for ${item.itemName}:`, error);
          }
        }
      }

      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotationNumber || 'draft'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF downloaded successfully with datasheets!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendEmail = async () => {
    if (!customerEmail) {
      toast({
        title: "Email Required",
        description: "Please enter customer email",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Email Feature",
      description: "Email functionality with PDF attachment will be set up with Resend integration",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 font-heading">
            <FileEdit className="h-8 w-8 text-primary" />
            Quotation Management
          </h1>
          <p className="text-muted-foreground font-sans">Create and manage quotations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveQuotation} disabled={isSaving} className="gap-2">
            <Download className="h-4 w-4" />
            {isSaving ? "Saving..." : currentQuotationId ? "Update" : "Save"}
          </Button>
          <Button onClick={resetForm} className="gap-2">
            <Plus className="h-4 w-4" />
            New Quotation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Quotation Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={cn("grid w-full", isCreatingQuotation ? "grid-cols-5" : "grid-cols-1")}>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="h-4 w-4" />
                    List
                  </TabsTrigger>
                  {isCreatingQuotation && (
                    <>
                      <TabsTrigger value="create" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create
                      </TabsTrigger>
                      <TabsTrigger value="tool" className="gap-2">
                        <Wrench className="h-4 w-4" />
                        Tool
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="email" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Send Email
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>

                <TabsContent value="list" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Previous Quotations</h3>
                      <span className="text-sm text-muted-foreground">{quotations.length} quotations</span>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by quotation number, customer name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Status Filter Tabs */}
                    <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "pending" | "done")} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="done">Done</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    {loadingQuotations ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">Loading quotations...</p>
                      </div>
                    ) : quotations.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg bg-muted/20">
                        <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">No quotations yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Create your first quotation to see it here</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {quotations
                          .filter((quotation: any) => {
                            // Apply search filter
                            const matchesSearch = 
                              quotation.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              quotation.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
                            
                            // Apply status filter
                            const matchesStatus = 
                              statusFilter === "all" ||
                              (statusFilter === "pending" && !quotation.is_completed) ||
                              (statusFilter === "done" && quotation.is_completed);
                            
                            return matchesSearch && matchesStatus;
                          })
                          .map((quotation: any) => (
                          <div key={quotation.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-sm truncate">
                                    {quotation.quotation_number}
                                  </h4>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(quotation.quotation_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {quotation.customer_name}
                                </p>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    ${quotation.total.toFixed(2)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {quotation.items?.length || 0} items
                                  </span>
                                  {/* Status Badge */}
                                  <span className={cn(
                                    "text-xs px-2 py-0.5 rounded flex items-center gap-1",
                                    quotation.status === "sent" 
                                      ? "bg-green-100 text-green-700" 
                                      : "bg-gray-100 text-gray-700"
                                  )}>
                                    {quotation.status === "sent" ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3" />
                                        Sent
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3 w-3" />
                                        Unsent
                                      </>
                                    )}
                                  </span>
                                  {/* Completion Badge */}
                                  {quotation.is_completed && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                      Completed
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleQuotationStatus(quotation.id, quotation.status)}
                                  className="h-8"
                                  title={quotation.status === "sent" ? "Mark as unsent" : "Mark as sent"}
                                >
                                  {quotation.status === "sent" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-gray-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleQuotationCompletion(quotation.id, quotation.is_completed)}
                                  className="h-8"
                                  title={quotation.is_completed ? "Mark as pending" : "Mark as done"}
                                >
                                  <Check className={cn(
                                    "h-3.5 w-3.5",
                                    quotation.is_completed ? "text-blue-600" : "text-gray-400"
                                  )} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => loadQuotation(quotation)}
                                  className="h-8"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteQuotation(quotation.id)}
                                  className="h-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="create" className="space-y-4 mt-4">
                  {/* Quotation Details */}
                  <div className="border rounded-lg p-4 bg-card animate-fade-in">
                    <h3 className="text-sm font-semibold mb-3 text-primary">Quotation Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="quotationNumber" className="text-xs">Quotation Number</Label>
                        <Input
                          id="quotationNumber"
                          value={quotationNumber}
                          onChange={(e) => setQuotationNumber(e.target.value)}
                          placeholder="QUO-000001"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="quotationDate" className="text-xs">Quotation Date</Label>
                        <Input
                          id="quotationDate"
                          type="date"
                          value={quotationDate}
                          onChange={(e) => setQuotationDate(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="paymentType" className="text-xs">Payment Type</Label>
                        <Select value={paymentType} onValueChange={(value: "cash" | "online") => setPaymentType(value)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="acsuPoints" className="text-xs">ACSU Points</Label>
                        <Input
                          id="acsuPoints"
                          type="number"
                          value={acsuPoints}
                          onChange={(e) => setAcsuPoints(Number(e.target.value))}
                          placeholder="0"
                          min="0"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="validUntil" className="text-xs">Valid Until</Label>
                        <Input
                          id="validUntil"
                          type="date"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="border rounded-lg p-4 bg-card animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-primary">Customer Information</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddCustomer(!showAddCustomer)}
                        className="h-7 text-xs gap-1.5"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {showAddCustomer ? "Search Customer" : "Add New"}
                      </Button>
                    </div>
                    
                    {!showAddCustomer ? (
                      <div className="space-y-3">
                        {/* Search Existing Customer */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Search Customer</Label>
                          <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={customerSearchOpen}
                                className="w-full justify-between h-9 font-normal"
                              >
                                <span className="flex items-center gap-2">
                                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                                  {selectedCustomer
                                    ? existingCustomers.find((customer) => customer.id === selectedCustomer)?.name
                                    : "Search for a customer..."}
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search customer by name..." />
                                <CommandList>
                                  <CommandEmpty>No customer found.</CommandEmpty>
                                  <CommandGroup>
                                    {existingCustomers.map((customer) => (
                                      <CommandItem
                                        key={customer.id}
                                        value={customer.name}
                                        onSelect={() => {
                                          setSelectedCustomer(customer.id);
                                          setCustomerName(customer.name);
                                          setCustomerEmail(customer.email);
                                          setCustomerPhone(customer.phone);
                                          setCustomerCompany(customer.company);
                                          setCustomerSearchOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedCustomer === customer.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{customer.name}</span>
                                          <span className="text-xs text-muted-foreground">{customer.email} • {customer.company}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        {/* Display Selected Customer Details */}
                        {selectedCustomer && (
                          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-md border">
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">Name</p>
                              <p className="text-xs font-medium">{customerName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">Email</p>
                              <p className="text-xs">{customerEmail}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">Phone</p>
                              <p className="text-xs">{customerPhone}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">Company</p>
                              <p className="text-xs">{customerCompany}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Add New Customer Form */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="newCustomerName" className="text-xs">Customer Name*</Label>
                            <Input
                              id="newCustomerName"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Enter customer name"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="newCustomerEmail" className="text-xs">Email*</Label>
                            <Input
                              id="newCustomerEmail"
                              type="email"
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                              placeholder="customer@email.com"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="newCustomerPhone" className="text-xs">Phone</Label>
                            <Input
                              id="newCustomerPhone"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="+61 400 000 000"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="newCustomerCompany" className="text-xs">Company</Label>
                            <Input
                              id="newCustomerCompany"
                              value={customerCompany}
                              onChange={(e) => setCustomerCompany(e.target.value)}
                              placeholder="Company name"
                              className="h-9"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            if (customerName && customerEmail) {
                              toast({
                                title: "Customer Added",
                                description: "New customer has been added successfully",
                              });
                              setShowAddCustomer(false);
                            } else {
                              toast({
                                title: "Required Fields",
                                description: "Please fill in customer name and email",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="w-full h-9"
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-2" />
                          Save Customer
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Items Section */}
                  <div className="border rounded-lg p-4 bg-card animate-fade-in">
                    <h3 className="text-sm font-semibold mb-3 text-primary">Items</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3 space-y-1.5">
                          <Label htmlFor="itemName" className="text-xs">Item Name</Label>
                          <Select value={newItemName} onValueChange={(value) => {
                            setNewItemName(value);
                            // Auto-fill description from master item
                            const selectedItem = masterItems.find(item => item.item_name === value);
                            if (selectedItem) {
                              setNewItemDesc(selectedItem.brand_details || selectedItem.remarks || value);
                            }
                          }}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {masterItems.map((item) => (
                                <SelectItem key={item.id} value={item.item_name}>
                                  {item.item_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="itemQty" className="text-xs">Qty</Label>
                          <Input
                            id="itemQty"
                            type="number"
                            placeholder="1"
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(Number(e.target.value))}
                            min="1"
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="itemRate" className="text-xs">Rate</Label>
                          <Input
                            id="itemRate"
                            type="number"
                            placeholder="0.00"
                            value={newItemRate}
                            onChange={(e) => setNewItemRate(Number(e.target.value))}
                            min="0"
                            step="0.01"
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="itemGst" className="text-xs">GST%</Label>
                          <Input
                            id="itemGst"
                            type="number"
                            placeholder="10"
                            value={newItemGst}
                            onChange={(e) => setNewItemGst(Number(e.target.value))}
                            min="0"
                            max="100"
                            step="0.1"
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="itemDiscount" className="text-xs">Disc%</Label>
                          <Input
                            id="itemDiscount"
                            type="number"
                            placeholder="0"
                            value={newItemDiscount}
                            onChange={(e) => setNewItemDiscount(Number(e.target.value))}
                            min="0"
                            max="100"
                            step="0.1"
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button onClick={addItem} className="w-full h-9 hover-scale">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="itemDescription" className="text-xs">Description</Label>
                        <Textarea
                          id="itemDescription"
                          placeholder="Item description"
                          value={newItemDesc}
                          onChange={(e) => setNewItemDesc(e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                      </div>

                      {/* Items Table */}
                      {items.length > 0 && (
                        <div className="border rounded-md mt-3 overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="h-9 text-xs">Item</TableHead>
                                <TableHead className="h-9 text-xs">Description</TableHead>
                                <TableHead className="text-right h-9 text-xs">Qty</TableHead>
                                <TableHead className="text-right h-9 text-xs">Rate</TableHead>
                                <TableHead className="text-right h-9 text-xs">GST%</TableHead>
                                <TableHead className="text-right h-9 text-xs">Disc%</TableHead>
                                <TableHead className="text-right h-9 text-xs">Amount</TableHead>
                                <TableHead className="w-[50px] h-9"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((item) => (
                                <TableRow key={item.id} className="hover:bg-muted/30">
                                  <TableCell className="font-medium py-2 text-sm">{item.itemName}</TableCell>
                                  <TableCell className="max-w-[200px] truncate py-2 text-sm">{item.description}</TableCell>
                                  <TableCell className="text-right py-2 text-sm">{item.quantity}</TableCell>
                                  <TableCell className="text-right py-2 text-sm">${item.rate.toFixed(2)}</TableCell>
                                  <TableCell className="text-right py-2 text-sm">{item.gst}%</TableCell>
                                  <TableCell className="text-right py-2 text-sm">{item.discount}%</TableCell>
                                  <TableCell className="text-right font-medium py-2 text-sm">${item.amount.toFixed(2)}</TableCell>
                                  <TableCell className="py-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeItem(item.id)}
                                      className="h-8 w-8"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="border rounded-lg p-4 bg-card animate-fade-in">
                    <h3 className="text-sm font-semibold mb-3 text-primary">Address</h3>
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-xs">Address</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter address..."
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="border rounded-lg p-4 bg-card animate-fade-in">
                    <h3 className="text-sm font-semibold mb-3 text-primary">Terms and Conditions</h3>
                    <Textarea
                      id="terms"
                      value={termsAndConditions}
                      onChange={(e) => setTermsAndConditions(e.target.value)}
                      placeholder="Enter terms and conditions..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={resetForm}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear Form
                    </Button>
                    <Button 
                      onClick={saveQuotation} 
                      disabled={isSaving}
                      className="gap-2 min-w-[140px]"
                    >
                      <Download className="h-4 w-4" />
                      {isSaving ? "Saving..." : currentQuotationId ? "Update Quotation" : "Save Quotation"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="tool" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Calculation Tools</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="taxRate">Tax Rate (%)</Label>
                        <Input
                          id="taxRate"
                          type="number"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discountRate">Discount (%)</Label>
                        <Input
                          id="discountRate"
                          type="number"
                          value={discountRate}
                          onChange={(e) => setDiscountRate(Number(e.target.value))}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-end items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">Preview Document</span>
                      <Button onClick={downloadPDF} variant="default" size="sm" className="gap-2 shadow-sm">
                        <Download className="h-4 w-4" />
                        Export PDF
                      </Button>
                    </div>
                    
                    {/* Page 1 */}
                    <div 
                      ref={previewRef} 
                      className={cn(
                        "shadow-lg overflow-hidden animate-fade-in",
                        quotationSettings?.template === 'classic' && "border-4 border-gray-900 bg-white",
                        quotationSettings?.template === 'minimal' && "border border-gray-200 bg-white",
                        quotationSettings?.template === 'professional' && "bg-gradient-to-b from-indigo-50 to-white",
                        quotationSettings?.template === 'corporate-blue' && "border-t-8 border-blue-700 bg-white",
                        quotationSettings?.template === 'elegant' && "bg-gradient-to-b from-amber-50 to-white border-2 border-amber-200",
                        (!quotationSettings?.template || quotationSettings?.template === 'modern') && "bg-white"
                      )}
                      style={{ 
                        fontFamily: quotationSettings?.font === 'inter' ? 'Inter' :
                                   quotationSettings?.font === 'roboto' ? 'Roboto' :
                                   quotationSettings?.font === 'opensans' ? 'Open Sans' :
                                   quotationSettings?.font === 'lato' ? 'Lato' :
                                   quotationSettings?.font === 'montserrat' ? 'Montserrat' :
                                   quotationSettings?.font === 'poppins' ? 'Poppins' :
                                   quotationSettings?.font === 'raleway' ? 'Raleway' :
                                   quotationSettings?.font === 'playfair' ? 'Playfair Display' :
                                   quotationSettings?.font === 'merriweather' ? 'Merriweather' :
                                   quotationSettings?.font === 'sourcesans' ? 'Source Sans Pro' : 'Inter',
                      }}
                    >
                      {/* Header Text - if provided */}
                      {quotationSettings?.header_text && (
                        <div className={cn(
                          "px-10 py-4 text-center text-sm",
                          quotationSettings?.template === 'modern' && "bg-gradient-to-r from-blue-600 to-blue-500 text-white",
                          quotationSettings?.template === 'classic' && "bg-gray-900 text-white border-b-2 border-gray-900",
                          quotationSettings?.template === 'minimal' && "border-b border-gray-200 text-gray-600",
                          quotationSettings?.template === 'professional' && "bg-indigo-600 text-white",
                          quotationSettings?.template === 'corporate-blue' && "bg-blue-700 text-white",
                          quotationSettings?.template === 'elegant' && "bg-amber-100 text-amber-900 border-b-2 border-amber-300"
                        )}>
                          {quotationSettings.header_text}
                        </div>
                      )}

                      {/* Header Section */}
                      <div className={cn(
                        "px-10 py-8",
                        quotationSettings?.template === 'modern' && "bg-gradient-to-r from-blue-600 to-blue-500 text-white",
                        quotationSettings?.template === 'classic' && "bg-gray-900 text-white",
                        quotationSettings?.template === 'minimal' && "border-b border-gray-200",
                        quotationSettings?.template === 'professional' && "bg-white mx-4 mt-4 rounded-lg shadow-sm border border-indigo-100",
                        quotationSettings?.template === 'corporate-blue' && "border-b-4 border-blue-700",
                        quotationSettings?.template === 'elegant' && "border-b-2 border-amber-300",
                        (!quotationSettings?.template || quotationSettings?.template === 'modern') && "border-b"
                      )}>
                        <div className="flex justify-between items-start">
                          {/* Left Side - Logo */}
                          <div className="flex-shrink-0">
                            {quotationSettings?.logo_url && (
                              <img 
                                src={quotationSettings.logo_url} 
                                alt="Company Logo" 
                                className="h-24 w-auto object-contain"
                              />
                            )}
                          </div>
                          
                          {/* Right Side - Company Info */}
                          <div className={cn(
                            "text-right space-y-1",
                            (quotationSettings?.template === 'modern' || quotationSettings?.template === 'classic') && "text-white"
                          )}>
                            <p 
                              className="text-2xl font-bold"
                              style={{ 
                                color: (quotationSettings?.template === 'modern' || quotationSettings?.template === 'classic') ? 'white' : (quotationSettings?.primary_color || '#1D8FCC')
                              }}
                            >
                              {customerCompany || "Your Company Name"}
                            </p>
                            <p className={cn(
                              "text-sm",
                              (quotationSettings?.template === 'modern' || quotationSettings?.template === 'classic') ? "text-white/90" : "text-gray-600"
                            )}>{address || "12 Stelvio Close"}</p>
                            <p className={cn(
                              "text-sm",
                              (quotationSettings?.template === 'modern' || quotationSettings?.template === 'classic') ? "text-white/90" : "text-gray-600"
                            )}>{customerEmail || "info@yourcompany.com"}</p>
                            <p className={cn(
                              "text-sm",
                              (quotationSettings?.template === 'modern' || quotationSettings?.template === 'classic') ? "text-white/90" : "text-gray-600"
                            )}>{customerPhone || "03 8787 8779"}</p>
                            <p className={cn(
                              "text-sm",
                              (quotationSettings?.template === 'modern' || quotationSettings?.template === 'classic') ? "text-white/90" : "text-gray-600"
                            )}>ABN: 71 608 672 608</p>
                          </div>
                        </div>
                      </div>

                      {/* Tax Invoice Title */}
                      <div className={cn(
                        "px-10 py-6",
                        quotationSettings?.template === 'modern' && "bg-blue-50",
                        quotationSettings?.template === 'classic' && "border-y-4 border-gray-900 text-center",
                        quotationSettings?.template === 'minimal' && "text-center",
                        quotationSettings?.template === 'professional' && "bg-indigo-100 mx-4 rounded",
                        quotationSettings?.template === 'corporate-blue' && "bg-blue-50",
                        quotationSettings?.template === 'elegant' && "text-center border-y-2 border-amber-300"
                      )}>
                        <h1 
                          className={cn(
                            "text-4xl font-bold",
                            quotationSettings?.template === 'minimal' && "inline-block border-b-2",
                            quotationSettings?.template === 'elegant' && "inline-block"
                          )}
                          style={{ 
                            color: quotationSettings?.primary_color || '#1D8FCC',
                            borderColor: quotationSettings?.template === 'minimal' ? (quotationSettings?.primary_color || '#1D8FCC') : undefined
                          }}
                        >
                          Tax Invoice
                        </h1>
                      </div>

                      {/* Bill To Section */}
                      <div className={cn(
                        "px-10 pb-6",
                        quotationSettings?.template === 'elegant' && "border-l-4 border-amber-400 ml-10"
                      )}>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <p 
                              className="text-sm font-semibold mb-2"
                              style={{ color: quotationSettings?.template === 'elegant' ? (quotationSettings?.primary_color || '#D97706') : undefined }}
                            >
                              Bill To: {customerName || "Customer Name"}
                            </p>
                            {customerEmail && <p className="text-sm text-gray-600">Email: {customerEmail}</p>}
                            {address && <p className="text-sm text-gray-600">Address: {address}</p>}
                            {customerPhone && <p className="text-sm text-gray-600">Phone: {customerPhone}</p>}
                          </div>
                          
                          {/* Invoice Details Table */}
                          <div>
                            <table className="w-full border-collapse border border-gray-300">
                              <tbody>
                                <tr className="border-b border-gray-300">
                                  <td className="px-3 py-2 text-sm font-semibold bg-gray-50">Invoice No:</td>
                                  <td className="px-3 py-2 text-sm">{quotationNumber}</td>
                                </tr>
                                <tr className="border-b border-gray-300">
                                  <td className="px-3 py-2 text-sm font-semibold bg-gray-50">Date:</td>
                                  <td className="px-3 py-2 text-sm">{new Date(quotationDate).toLocaleDateString('en-GB')}</td>
                                </tr>
                                <tr className="border-b border-gray-300">
                                  <td className="px-3 py-2 text-sm font-semibold bg-gray-50">Terms:</td>
                                  <td className="px-3 py-2 text-sm">NET 0</td>
                                </tr>
                                <tr>
                                  <td className="px-3 py-2 text-sm font-semibold bg-gray-50">Due Date:</td>
                                  <td className="px-3 py-2 text-sm">{new Date(quotationDate).toLocaleDateString('en-GB')}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="px-10 pb-6">
                        <div className="overflow-hidden border border-gray-300">
                          <table className="w-full">
                            <thead>
                              <tr 
                                className={cn(
                                  "border-b border-gray-300",
                                  quotationSettings?.template === 'modern' && "bg-blue-600 text-white",
                                  quotationSettings?.template === 'classic' && "bg-gray-900 text-white",
                                  quotationSettings?.template === 'minimal' && "bg-gray-100",
                                  quotationSettings?.template === 'professional' && "bg-indigo-600 text-white",
                                  quotationSettings?.template === 'corporate-blue' && "bg-blue-700 text-white",
                                  quotationSettings?.template === 'elegant' && "bg-amber-100",
                                  (!quotationSettings?.template || quotationSettings?.template === 'modern') && "bg-gray-100"
                                )}
                              >
                                <th className="text-left py-3 px-3 text-xs font-bold">Code</th>
                                <th className="text-left py-3 px-3 text-xs font-bold">Description</th>
                                <th className="text-center py-3 px-3 text-xs font-bold">Quantity</th>
                                <th className="text-right py-3 px-3 text-xs font-bold">Rate</th>
                                <th className="text-right py-3 px-3 text-xs font-bold">GST</th>
                                <th className="text-right py-3 px-3 text-xs font-bold">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.length > 0 ? (
                                items.map((item) => (
                                  <tr key={item.id} className="border-b border-gray-200">
                                    <td className="py-3 px-3 text-sm text-gray-900 align-top">{item.itemName}</td>
                                    <td className="py-3 px-3 text-sm text-gray-700 align-top">{item.description}</td>
                                    <td className="py-3 px-3 text-sm text-gray-900 text-center align-top">{item.quantity}</td>
                                    <td className="py-3 px-3 text-sm text-gray-900 text-right align-top">${item.rate.toFixed(2)}</td>
                                    <td className="py-3 px-3 text-sm text-gray-900 text-right align-top">{item.gst}%</td>
                                    <td className="py-3 px-3 text-sm font-semibold text-gray-900 text-right align-top">${item.amount.toFixed(2)}</td>
                                  </tr>
                                ))
                               ) : (
                                <tr>
                                  <td colSpan={6} className="py-8 text-center text-sm text-gray-500">No items added yet</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Parts Subtotal */}
                        {items.length > 0 && (
                          <div className="flex justify-end mt-4">
                            <p className="text-sm font-semibold">Parts Subtotal: ${subtotal.toFixed(2)}</p>
                          </div>
                        )}

                        {/* Datasheets Section */}
                        {items.some(item => item.datasheetUrl) && (
                          <div className="mt-6">
                            <h4 className="text-sm font-semibold mb-3 text-gray-700">Attached Datasheets:</h4>
                            <div className="space-y-2">
                              {items.filter(item => item.datasheetUrl).map((item) => (
                                <div key={item.id} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                                  <FileText className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">{item.itemName}:</span>
                                  <a 
                                    href={item.datasheetUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    View Datasheet
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Page Break Indicator */}
                      <div className="px-10 py-4 border-t border-gray-300 bg-gray-50">
                        <p className="text-xs text-center text-gray-500">1 / 2</p>
                      </div>

                      {/* Page 2 - Payment Details */}
                      <div className="px-10 py-8 border-t-4 border-gray-300">
                        <h2 
                          className="text-2xl font-bold mb-6"
                          style={{ color: quotationSettings?.primary_color || '#1D8FCC' }}
                        >
                          Payment Details
                        </h2>
                        
                        <div className="space-y-4">
                          {/* Payment Summary Table */}
                          <table className="w-full max-w-md ml-auto">
                            <tbody>
                              <tr className="border-b border-gray-200">
                                <td className="py-2 text-sm font-medium text-gray-700">Subtotal</td>
                                <td className="py-2 text-sm text-right font-semibold">${subtotal.toFixed(2)}</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="py-2 text-sm font-medium text-gray-700">Includes GST 10% (${(subtotal * 0.909).toFixed(2)})</td>
                                <td className="py-2 text-sm text-right font-semibold">${(subtotal * 0.091).toFixed(2)}</td>
                              </tr>
                              <tr className="border-b-2 border-gray-400">
                                <td className="py-2 text-base font-bold text-gray-900">Total</td>
                                <td className="py-2 text-base text-right font-bold text-gray-900">${total.toFixed(2)}</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="py-2 text-sm font-medium text-gray-700">PAID</td>
                                <td className="py-2 text-sm text-right font-semibold">$0.00</td>
                              </tr>
                              <tr className="bg-gray-50">
                                <td className="py-3 text-base font-bold text-gray-900">Balance Due</td>
                                <td className="py-3 text-base text-right font-bold" style={{ color: quotationSettings?.primary_color || '#1D8FCC' }}>
                                  ${total.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Payment Info */}
                          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Payment to {customerCompany || "Your Company"}</p>
                            <p className="text-sm text-gray-600">BSB: 083-802</p>
                            <p className="text-sm text-gray-600">Acc: 91-925-6458</p>
                          </div>
                        </div>
                      </div>

                      {/* Notes Section */}
                      <div className="px-10 pb-8">
                        <h3 className="text-lg font-bold mb-3" style={{ color: quotationSettings?.primary_color || '#1D8FCC' }}>
                          Notes
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {termsAndConditions || "All installations carry 3-year warranty plus 7-year cabling and hardware warranty. All work done by licensed professionals with appropriate certifications."}
                        </p>
                      </div>

                      {/* Footer Text */}
                      {quotationSettings?.footer_text && (
                        <div className="px-10 pb-6 text-center border-t border-gray-200 pt-4">
                          <p className="text-sm text-gray-600">{quotationSettings.footer_text}</p>
                        </div>
                      )}

                      {/* Page Number */}
                      <div className="px-10 py-4 bg-gray-50">
                        <p className="text-xs text-center text-gray-500">2 / 2</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Send Quotation via Email</h3>
                    <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          📎 PDF attachment will be generated and attached automatically
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Filename: Quotation-{quotationNumber}.pdf
                        </p>
                      </div>
                      
                      {items.some(item => item.datasheetUrl) && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            Additional Datasheets to be attached:
                          </p>
                          <div className="space-y-1">
                            {items.filter(item => item.datasheetUrl).map((item) => (
                              <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                <span>{item.itemName} - Datasheet.pdf</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="emailTo">To</Label>
                        <Input
                          id="emailTo"
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="customer@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailSubject">Subject</Label>
                        <Input
                          id="emailSubject"
                          defaultValue={`Quotation ${quotationNumber} - ${customerName || 'Your Business'}`}
                          placeholder="Email subject"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailMessage">Message</Label>
                        <Textarea
                          id="emailMessage"
                          placeholder="Email message..."
                          rows={6}
                          defaultValue={`Dear ${customerName || 'Customer'},\n\nPlease find attached our quotation (${quotationNumber}) for your reference.\n\nQuotation Details:\n- Total Amount: $${total.toFixed(2)}\n- Payment Type: ${paymentType}\n- Valid Until: ${validUntil || 'As specified'}\n\nIf you have any questions or need further clarification, please don't hesitate to contact us.\n\nBest regards,\nBMS Pro Team`}
                        />
                      </div>
                      <Button onClick={sendEmail} className="w-full gap-2" disabled={!customerEmail || items.length === 0}>
                        <Send className="h-4 w-4" />
                        Send Quotation with PDF
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Estimates Section - Right Side */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Estimates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tax ({taxRate}%)</span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                {discountRate > 0 && (
                  <div className="flex justify-between items-center text-destructive">
                    <span className="text-sm">Discount ({discountRate}%)</span>
                    <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 space-y-2 border-t">
                <p className="text-xs text-muted-foreground">Items: {items.length}</p>
                <p className="text-xs text-muted-foreground">
                  Total Units: {items.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
