import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const organisationSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  abn: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(6, "Password must be at least 6 characters"),
  new_password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type OrganisationFormData = z.infer<typeof organisationSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Company() {
  const organisationForm = useForm<OrganisationFormData>({
    resolver: zodResolver(organisationSchema),
    defaultValues: {
      company_name: "",
      abn: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      country: "Australia",
      phone: "",
      email: "",
      website: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onOrganisationSubmit = (data: OrganisationFormData) => {
    console.log("Organisation data:", data);
    toast.success("Organisation profile updated successfully");
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    console.log("Password change:", data);
    toast.success("Password changed successfully");
    passwordForm.reset();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building className="h-8 w-8 text-primary" />
          Company Accounts
        </h1>
        <p className="text-muted-foreground">Manage your company accounts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organisation Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={organisationForm.handleSubmit(onOrganisationSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  {...organisationForm.register("company_name")}
                  placeholder="Enter company name"
                />
                {organisationForm.formState.errors.company_name && (
                  <p className="text-sm text-destructive">
                    {organisationForm.formState.errors.company_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="abn">ABN</Label>
                <Input
                  id="abn"
                  {...organisationForm.register("abn")}
                  placeholder="Enter ABN"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...organisationForm.register("address")}
                placeholder="Enter street address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...organisationForm.register("city")}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  {...organisationForm.register("state")}
                  placeholder="Enter state"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  {...organisationForm.register("postal_code")}
                  placeholder="Enter postal code"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...organisationForm.register("country")}
                  placeholder="Enter country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...organisationForm.register("phone")}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...organisationForm.register("email")}
                  placeholder="Enter email address"
                />
                {organisationForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {organisationForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...organisationForm.register("website")}
                  placeholder="Enter website URL"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Save Organisation Profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password *</Label>
              <Input
                id="current_password"
                type="password"
                {...passwordForm.register("current_password")}
                placeholder="Enter current password"
              />
              {passwordForm.formState.errors.current_password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.current_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password *</Label>
              <Input
                id="new_password"
                type="password"
                {...passwordForm.register("new_password")}
                placeholder="Enter new password"
              />
              {passwordForm.formState.errors.new_password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password *</Label>
              <Input
                id="confirm_password"
                type="password"
                {...passwordForm.register("confirm_password")}
                placeholder="Confirm new password"
              />
              {passwordForm.formState.errors.confirm_password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirm_password.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit">Change Password</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
