import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserCog, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const countryCodes = [
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+91", country: "India", flag: "🇮🇳" },
];

const formSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  country_code: z.string().min(1, "Country code is required"),
  contact_number: z.string().min(1, "Contact number is required"),
  email: z.string().email().optional().or(z.literal("")),
  fax: z.string().optional(),
  id_type_name: z.string().optional(),
  id_type_number: z.string().optional(),
  credit_limit: z.string().optional(),
  address: z.string().optional(),
  is_active: z.boolean().default(true),
  is_blacklisted: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function Customers() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: "",
      country_code: "+61",
      contact_number: "",
      email: "",
      fax: "",
      id_type_name: "",
      id_type_number: "",
      credit_limit: "",
      address: "",
      is_active: true,
      is_blacklisted: false,
    },
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const customerData = {
        customer_name: values.customer_name,
        country_code: values.country_code,
        contact_number: values.contact_number,
        email: values.email || null,
        fax: values.fax || null,
        id_type_name: values.id_type_name || null,
        id_type_number: values.id_type_number || null,
        credit_limit: values.credit_limit ? parseFloat(values.credit_limit) : null,
        address: values.address || null,
        is_active: values.is_active,
        is_blacklisted: values.is_blacklisted,
        user_id: user.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Customer updated successfully" });
      } else {
        const { error } = await supabase
          .from("customers")
          .insert([customerData]);

        if (error) throw error;
        toast({ title: "Customer added successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      form.reset();
      setEditingId(null);
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: "Failed to save customer",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (customer: any) => {
    setEditingId(customer.id);
    form.reset({
      customer_name: customer.customer_name,
      country_code: customer.country_code,
      contact_number: customer.contact_number,
      email: customer.email || "",
      fax: customer.fax || "",
      id_type_name: customer.id_type_name || "",
      id_type_number: customer.id_type_number || "",
      credit_limit: customer.credit_limit?.toString() || "",
      address: customer.address || "",
      is_active: customer.is_active,
      is_blacklisted: customer.is_blacklisted,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({ title: "Customer deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="h-8 w-8 text-primary" />
            Customer Management
          </h1>
          <p className="text-muted-foreground">Manage your customers</p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="country_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country Code *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countryCodes.map((cc) => (
                              <SelectItem key={cc.code} value={cc.code}>
                                {cc.flag} {cc.code} {cc.country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_number"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Contact Number *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter phone number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fax (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="id_type_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Type Name (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Passport, Driver's License" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="id_type_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Type Number (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="credit_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Limit (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Enter Australian address"
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-6">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Is Active</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_blacklisted"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Is Blacklisted</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingId ? "Update Customer" : "Add Customer"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading customers...</p>
          ) : customers && customers.length > 0 ? (
            <div className="space-y-4">
              {customers.map((customer) => (
                <Card key={customer.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{customer.customer_name}</h3>
                          {customer.is_active && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                          )}
                          {customer.is_blacklisted && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Blacklisted</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {customer.country_code} {customer.contact_number}
                        </p>
                        {customer.email && (
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        )}
                        {customer.address && (
                          <p className="text-sm text-muted-foreground">{customer.address}</p>
                        )}
                        {customer.credit_limit && (
                          <p className="text-sm">
                            <span className="font-medium">Credit Limit:</span> ${customer.credit_limit}
                          </p>
                        )}
                        {customer.id_type_name && customer.id_type_number && (
                          <p className="text-sm">
                            <span className="font-medium">{customer.id_type_name}:</span> {customer.id_type_number}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No customers added yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
