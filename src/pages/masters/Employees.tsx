// ===== IMPORTS =====
// React and UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Form handling and validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// State and notifications
import { useState } from "react";
import { toast } from "sonner";

// ===== FORM VALIDATION SCHEMA =====
/**
 * Zod schema for employee form validation
 * Defines required fields, types, and validation rules
 */
const employeeFormSchema = z.object({
  employeeName: z.string().min(1, "Employee name is required"),
  designation: z.string().min(1, "Designation is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  parentName: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * Employees Component
 * 
 * Manages employee records with:
 * - Add new employee dialog
 * - Employee list display
 * - Form validation
 * 
 * TODO: Connect to Supabase backend for data persistence
 */
export default function Employees() {
  // ===== STATE =====
  // Control dialog open/close state
  const [open, setOpen] = useState(false);
  
  // ===== FORM SETUP =====
  // Initialize form with validation schema and default values
  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employeeName: "",
      designation: "",
      email: "",
      phone: "",
      address: "",
      parentName: "",
      password: "",
    },
  });

  // ===== FORM HANDLERS =====
  /**
   * Handle form submission
   * Currently logs data and shows success toast
   * TODO: Save to Supabase database
   */
  const onSubmit = (values: z.infer<typeof employeeFormSchema>) => {
    console.log(values);
    toast.success("Employee added successfully");
    form.reset();
    setOpen(false);
  };

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      {/* Page header with title and add button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Employee Management
          </h1>
          <p className="text-muted-foreground">Manage your employees</p>
        </div>
        
        {/* Add employee dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            
            {/* Employee form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Employee Name Field */}
                <FormField
                  control={form.control}
                  name="employeeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter employee name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Designation Field */}
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter designation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Field */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address Field */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Parent Name Field (Optional) */}
                <FormField
                  control={form.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's/Mother's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter parent's name (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password (min. 6 characters)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Form action buttons */}
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Employee</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employee list card */}
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {/* TODO: Replace with actual employee list from database */}
          <p className="text-muted-foreground">No employees added yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
