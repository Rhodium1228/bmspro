import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileEdit, Wrench, Eye, Mail, Calculator, Trash2, Send } from "lucide-react";
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
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  
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

                <TabsContent value="create" className="space-y-6 mt-4">
                  {/* Quotation Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quotation Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quotationNumber">Quotation Number</Label>
                          <Input
                            id="quotationNumber"
                            value={quotationNumber}
                            onChange={(e) => setQuotationNumber(e.target.value)}
                            placeholder="QUO-000001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quotationDate">Quotation Date</Label>
                          <Input
                            id="quotationDate"
                            type="date"
                            value={quotationDate}
                            onChange={(e) => setQuotationDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentType">Payment Type</Label>
                          <Select value={paymentType} onValueChange={(value: "cash" | "online") => setPaymentType(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="acsuPoints">ACSU Points</Label>
                          <Input
                            id="acsuPoints"
                            type="number"
                            value={acsuPoints}
                            onChange={(e) => setAcsuPoints(Number(e.target.value))}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="customerName">Customer Name</Label>
                          <Input
                            id="customerName"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Search and select customer"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerEmail">Customer Email</Label>
                          <Input
                            id="customerEmail"
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="customer@email.com"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Items Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-3 space-y-2">
                            <Label htmlFor="itemName">Item Name</Label>
                            <Select value={newItemName} onValueChange={setNewItemName}>
                              <SelectTrigger>
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
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="itemQty">Quantity</Label>
                            <Input
                              id="itemQty"
                              type="number"
                              placeholder="Qty"
                              value={newItemQty}
                              onChange={(e) => setNewItemQty(Number(e.target.value))}
                              min="1"
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="itemRate">Rate</Label>
                            <Input
                              id="itemRate"
                              type="number"
                              placeholder="Rate"
                              value={newItemRate}
                              onChange={(e) => setNewItemRate(Number(e.target.value))}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="itemGst">GST (%)</Label>
                            <Input
                              id="itemGst"
                              type="number"
                              placeholder="GST %"
                              value={newItemGst}
                              onChange={(e) => setNewItemGst(Number(e.target.value))}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="itemDiscount">Discount (%)</Label>
                            <Input
                              id="itemDiscount"
                              type="number"
                              placeholder="Disc %"
                              value={newItemDiscount}
                              onChange={(e) => setNewItemDiscount(Number(e.target.value))}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button onClick={addItem} className="w-full">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="itemDescription">Item Description</Label>
                          <Textarea
                            id="itemDescription"
                            placeholder="Item description"
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>

                      {/* Items Table */}
                      {items.length > 0 && (
                        <div className="border rounded-lg mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Rate</TableHead>
                                <TableHead className="text-right">GST%</TableHead>
                                <TableHead className="text-right">Disc%</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.itemName}</TableCell>
                                  <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                                  <TableCell className="text-right">{item.quantity}</TableCell>
                                  <TableCell className="text-right">${item.rate.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">{item.gst}%</TableCell>
                                  <TableCell className="text-right">{item.discount}%</TableCell>
                                  <TableCell className="text-right font-medium">${item.amount.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Address Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="address">Search Australian Address</Label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Search for address in Australia"
                        />
                        <p className="text-xs text-muted-foreground">
                          Start typing to search for addresses in Australia
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Terms and Conditions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Terms and Conditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        id="terms"
                        value={termsAndConditions}
                        onChange={(e) => setTermsAndConditions(e.target.value)}
                        placeholder="Enter terms and conditions..."
                        rows={4}
                      />
                    </CardContent>
                  </Card>
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
