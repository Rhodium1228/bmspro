import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileEdit, Wrench, Eye, Mail, Calculator, Trash2, Send, Search, UserPlus, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface QuotationItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  rate: number;
  gst: number;
  discount: number;
  amount: number;
}

export default function Quotation() {
  const { toast } = useToast();
  const [items, setItems] = useState<QuotationItem[]>([]);
  
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

    const newItem: QuotationItem = {
      id: Date.now().toString(),
      itemName: newItemName,
      description: newItemDesc,
      quantity: newItemQty,
      rate: newItemRate,
      gst: newItemGst,
      discount: newItemDiscount,
      amount: totalAmount,
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
      description: "Email functionality will be set up with Resend integration",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileEdit className="h-8 w-8 text-primary" />
            Quotation Management
          </h1>
          <p className="text-muted-foreground">Create and manage quotations</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Quotation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Quotation Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
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
                </TabsList>

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
                          <Select value={newItemName} onValueChange={setNewItemName}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Product A">Product A</SelectItem>
                              <SelectItem value="Product B">Product B</SelectItem>
                              <SelectItem value="Service C">Service C</SelectItem>
                              <SelectItem value="Custom">Custom Item</SelectItem>
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
                      <Label htmlFor="address" className="text-xs">Search Australian Address</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Start typing to search..."
                        className="h-9"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Search for addresses in Australia
                      </p>
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
                  <div className="space-y-4 p-6 border rounded-lg bg-background">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Quotation</h2>
                      <p className="text-sm text-muted-foreground">Date: {quotationDate}</p>
                      {validUntil && <p className="text-sm text-muted-foreground">Valid Until: {validUntil}</p>}
                    </div>

                    {customerName && (
                      <div className="space-y-1">
                        <p className="font-semibold">Customer:</p>
                        <p>{customerName}</p>
                        {customerEmail && <p className="text-sm text-muted-foreground">{customerEmail}</p>}
                      </div>
                    )}

                    {items.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="text-right">Rate</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">${item.rate.toFixed(2)}</TableCell>
                                <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax ({taxRate}%):</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                      {discountRate > 0 && (
                        <div className="flex justify-between text-destructive">
                          <span>Discount ({discountRate}%):</span>
                          <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span className="text-primary">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {termsAndConditions && (
                      <div className="space-y-2 pt-4 border-t">
                        <p className="font-semibold">Terms & Conditions:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{termsAndConditions}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Send Quotation</h3>
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
                          defaultValue={`Quotation for ${customerName || 'Your Business'}`}
                          placeholder="Email subject"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailMessage">Message</Label>
                        <Textarea
                          id="emailMessage"
                          placeholder="Email message..."
                          rows={5}
                          defaultValue={`Dear ${customerName || 'Customer'},\n\nPlease find attached our quotation for your reference.\n\nBest regards,\nBMS Pro Team`}
                        />
                      </div>
                      <Button onClick={sendEmail} className="w-full gap-2">
                        <Send className="h-4 w-4" />
                        Send Quotation
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
