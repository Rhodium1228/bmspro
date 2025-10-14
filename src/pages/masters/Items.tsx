import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, Pencil, Trash2, FileText, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const itemFormSchema = z.object({
  itemGroup: z.string().min(1, "Item group is required"),
  unitOfMeasurement: z.string().min(1, "Unit of measurement is required"),
  itemName: z.string().min(1, "Item name is required"),
  brandDetails: z.string().optional(),
  remarks: z.string().optional(),
  datasheetUrl: z.string().optional(),
});

export default function Items() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof itemFormSchema>>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      itemGroup: "",
      unitOfMeasurement: "",
      itemName: "",
      brandDetails: "",
      remarks: "",
      datasheetUrl: "",
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDatasheetUpload = async (file: File) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('datasheets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('datasheets')
        .getPublicUrl(fileName);

      form.setValue('datasheetUrl', publicUrl);
      toast.success("Datasheet uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload datasheet");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof itemFormSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editingId) {
        const { error } = await supabase
          .from("items")
          .update({
            item_group: values.itemGroup,
            unit_of_measurement: values.unitOfMeasurement,
            item_name: values.itemName,
            brand_details: values.brandDetails || null,
            remarks: values.remarks || null,
            datasheet_url: values.datasheetUrl || null,
          })
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Item updated successfully");
      } else {
        const { error } = await supabase.from("items").insert({
          user_id: user.id,
          item_group: values.itemGroup,
          unit_of_measurement: values.unitOfMeasurement,
          item_name: values.itemName,
          brand_details: values.brandDetails || null,
          remarks: values.remarks || null,
          datasheet_url: values.datasheetUrl || null,
        });

        if (error) throw error;
        toast.success("Item added successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["items"] });
      form.reset();
      setDatasheetFile(null);
      setOpen(false);
      setEditingId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save item");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    form.reset({
      itemGroup: item.item_group,
      unitOfMeasurement: item.unit_of_measurement,
      itemName: item.item_name,
      brandDetails: item.brand_details || "",
      remarks: item.remarks || "",
      datasheetUrl: item.datasheet_url || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["items"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item");
    }
  };

  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
      setEditingId(null);
      setDatasheetFile(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Items Management
          </h1>
          <p className="text-muted-foreground">Manage your inventory items</p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Item" : "Add New Item"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="itemGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Group *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select item group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="raw-materials">Raw Materials</SelectItem>
                          <SelectItem value="finished-goods">Finished Goods</SelectItem>
                          <SelectItem value="consumables">Consumables</SelectItem>
                          <SelectItem value="spare-parts">Spare Parts</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitOfMeasurement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measurement *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">Kilogram (kg)</SelectItem>
                          <SelectItem value="g">Gram (g)</SelectItem>
                          <SelectItem value="l">Liter (l)</SelectItem>
                          <SelectItem value="ml">Milliliter (ml)</SelectItem>
                          <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="carton">Carton</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter item name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brandDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Details</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter brand details (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter any additional remarks (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="datasheetUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datasheet (PDF)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setDatasheetFile(file);
                                  handleDatasheetUpload(file);
                                }
                              }}
                              disabled={uploading}
                            />
                            {uploading && <Upload className="h-4 w-4 animate-pulse" />}
                          </div>
                          {field.value && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <a href={field.value} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                View uploaded datasheet
                              </a>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingId ? "Update Item" : "Add Item"}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading items...</p>
          ) : items && items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div>
                          <h3 className="font-semibold text-lg">{item.item_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Group: {item.item_group} | Unit: {item.unit_of_measurement}
                          </p>
                        </div>
                        {item.brand_details && (
                          <p className="text-sm">
                            <span className="font-medium">Brand:</span> {item.brand_details}
                          </p>
                        )}
                        {item.remarks && (
                          <p className="text-sm">
                            <span className="font-medium">Remarks:</span> {item.remarks}
                          </p>
                        )}
                        {item.datasheet_url && (
                          <a 
                            href={item.datasheet_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            View Datasheet
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
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
            <p className="text-muted-foreground">No items added yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
