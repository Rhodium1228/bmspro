// ===== IMPORTS =====
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Building, Lock, User, Mail, Phone, FileText, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// ===== CONSTANTS =====
/**
 * Country codes for mobile number display
 */
const countryCodes = [
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+91", country: "India", flag: "🇮🇳" },
];

// ===== VALIDATION SCHEMAS =====
/**
 * Schema for organization profile validation
 */
const organisationSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  country_code: z.string().min(1, "Country code is required"),
  mobile_number: z.string().min(8, "Please enter a valid mobile number"),
  is_merchant: z.boolean(),
});

/**
 * Schema for password change validation
 */
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

/**
 * Company Component
 * 
 * Displays and allows editing of organization profile information:
 * - Company name from sign-up
 * - Username
 * - Email
 * - Mobile number with country code
 * - Merchant status
 * - Password change functionality
 */
export default function Company() {
  // ===== STATE =====
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast: showToast } = useToast();
  
  // Quotation Settings State
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [selectedFont, setSelectedFont] = useState("inter");
  const [headerText, setHeaderText] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#1D8FCC");
  const [secondaryColor, setSecondaryColor] = useState("#0B1E3D");

  // ===== FORM SETUP =====
  const organisationForm = useForm<OrganisationFormData>({
    resolver: zodResolver(organisationSchema),
    defaultValues: {
      company_name: "",
      username: "",
      email: "",
      country_code: "+61",
      mobile_number: "",
      is_merchant: false,
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

  // ===== DATA FETCHING =====
  /**
   * Fetch organization profile from database
   */
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['organization-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('organization_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // ===== EFFECTS =====
  /**
   * Load profile data into form when fetched
   */
  useEffect(() => {
    if (profile) {
      organisationForm.reset({
        company_name: profile.company_name || "",
        username: profile.username || "",
        email: profile.email || "",
        country_code: profile.country_code || "+61",
        mobile_number: profile.mobile_number || "",
        is_merchant: profile.is_merchant || false,
      });
    }
  }, [profile]);

  // ===== FORM HANDLERS =====
  /**
   * Handle organization profile update
   */
  const onOrganisationSubmit = async (data: OrganisationFormData) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('organization_profiles')
        .update({
          company_name: data.company_name,
          username: data.username,
          email: data.email,
          country_code: data.country_code,
          mobile_number: data.mobile_number,
          full_phone: `${data.country_code} ${data.mobile_number}`,
          is_merchant: data.is_merchant,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Organisation profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ['organization-profile'] });
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle password change
   */
  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setLoading(true);

      // Verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User email not found");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.current_password,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: data.new_password,
      });

      if (error) throw error;

      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle logo upload for quotation settings
   */
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      showToast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    }
  };

  /**
   * Handle quotation settings save
   */
  const handleQuotationSettingsSave = () => {
    showToast({
      title: "Settings saved",
      description: "Your quotation settings have been saved successfully.",
    });
  };

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building className="h-8 w-8 text-primary" />
          Organisation Profile
        </h1>
        <p className="text-muted-foreground">Manage your organisation information from sign-up</p>
      </div>

      {/* Organisation Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organisation Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProfile ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          ) : !profile ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No profile found. Please sign up again.</p>
            </div>
          ) : (
            <form onSubmit={organisationForm.handleSubmit(onOrganisationSubmit)} className="space-y-4">
              {/* Company Name and Username Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company_name"
                      {...organisationForm.register("company_name")}
                      placeholder="Enter company name"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                  {organisationForm.formState.errors.company_name && (
                    <p className="text-sm text-destructive">
                      {organisationForm.formState.errors.company_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      {...organisationForm.register("username")}
                      placeholder="Enter username"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                  {organisationForm.formState.errors.username && (
                    <p className="text-sm text-destructive">
                      {organisationForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    {...organisationForm.register("email")}
                    placeholder="Enter email address"
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
                {organisationForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {organisationForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Mobile Number Field */}
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Country Code Selector */}
                  <Select
                    value={organisationForm.watch("country_code")}
                    onValueChange={(value) => organisationForm.setValue("country_code", value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="col-span-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      {countryCodes.map((cc) => (
                        <SelectItem key={cc.code} value={cc.code}>
                          {cc.flag} {cc.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Mobile Number Input */}
                  <div className="relative col-span-2">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mobile_number"
                      type="tel"
                      {...organisationForm.register("mobile_number")}
                      placeholder="Enter mobile number"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
                {organisationForm.formState.errors.mobile_number && (
                  <p className="text-sm text-destructive">
                    {organisationForm.formState.errors.mobile_number.message}
                  </p>
                )}
              </div>

              {/* Merchant Status Checkbox */}
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="is_merchant"
                  checked={organisationForm.watch("is_merchant")}
                  onCheckedChange={(checked) => 
                    organisationForm.setValue("is_merchant", checked as boolean)
                  }
                  disabled={loading}
                />
                <Label
                  htmlFor="is_merchant"
                  className="text-sm font-normal cursor-pointer"
                >
                  Registered as merchant account
                </Label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Organisation Profile"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            {/* Current Password Field */}
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password *</Label>
              <Input
                id="current_password"
                type="password"
                {...passwordForm.register("current_password")}
                placeholder="Enter current password"
                disabled={loading}
              />
              {passwordForm.formState.errors.current_password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.current_password.message}
                </p>
              )}
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password *</Label>
              <Input
                id="new_password"
                type="password"
                {...passwordForm.register("new_password")}
                placeholder="Enter new password"
                disabled={loading}
              />
              {passwordForm.formState.errors.new_password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.new_password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password *</Label>
              <Input
                id="confirm_password"
                type="password"
                {...passwordForm.register("confirm_password")}
                placeholder="Confirm new password"
                disabled={loading}
              />
              {passwordForm.formState.errors.confirm_password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirm_password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quotation Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quotation Settings
          </CardTitle>
          <CardDescription>Customize your quotation PDF preview</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="fonts">Fonts</TabsTrigger>
              <TabsTrigger value="header">Header</TabsTrigger>
              <TabsTrigger value="logo">Logo</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${selectedTemplate === "modern" ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedTemplate("modern")}
                  >
                    <CardContent className="p-6">
                      <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-primary/5 rounded-md mb-3 flex items-center justify-center">
                        <span className="text-muted-foreground">Modern</span>
                      </div>
                      <h3 className="font-semibold">Modern Template</h3>
                      <p className="text-sm text-muted-foreground">Clean and professional design</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${selectedTemplate === "classic" ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedTemplate("classic")}
                  >
                    <CardContent className="p-6">
                      <div className="aspect-[3/4] bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-md mb-3 flex items-center justify-center">
                        <span className="text-muted-foreground">Classic</span>
                      </div>
                      <h3 className="font-semibold">Classic Template</h3>
                      <p className="text-sm text-muted-foreground">Traditional business layout</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${selectedTemplate === "minimal" ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedTemplate("minimal")}
                  >
                    <CardContent className="p-6">
                      <div className="aspect-[3/4] bg-gradient-to-br from-muted/50 to-muted/20 rounded-md mb-3 flex items-center justify-center">
                        <span className="text-muted-foreground">Minimal</span>
                      </div>
                      <h3 className="font-semibold">Minimal Template</h3>
                      <p className="text-sm text-muted-foreground">Simple and elegant style</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fonts" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="heading-font">Heading Font</Label>
                <Select value={selectedFont} onValueChange={setSelectedFont}>
                  <SelectTrigger id="heading-font">
                    <SelectValue placeholder="Select heading font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="opensans">Open Sans</SelectItem>
                    <SelectItem value="lato">Lato</SelectItem>
                    <SelectItem value="montserrat">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body-font">Body Font</Label>
                <Select defaultValue="inter">
                  <SelectTrigger id="body-font">
                    <SelectValue placeholder="Select body font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="opensans">Open Sans</SelectItem>
                    <SelectItem value="lato">Lato</SelectItem>
                    <SelectItem value="arial">Arial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="header" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="company-name-header">Company Name</Label>
                <Input 
                  id="company-name-header" 
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="header-text">Header Text</Label>
                <Textarea 
                  id="header-text"
                  placeholder="Enter header text or tagline"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer-text">Footer Text</Label>
                <Textarea 
                  id="footer-text"
                  placeholder="Enter footer text"
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="logo" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input 
                      id="logo-upload" 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer"
                    />
                  </div>
                  <Button variant="outline" className="shrink-0">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                {logo && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {logo.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Logo Preview</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 flex items-center justify-center bg-muted/20">
                  {logo ? (
                    <img 
                      src={URL.createObjectURL(logo)} 
                      alt="Logo preview" 
                      className="max-h-32 object-contain"
                    />
                  ) : (
                    <p className="text-muted-foreground">No logo uploaded</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    id="primary-color" 
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input 
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                    placeholder="#1D8FCC"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    id="secondary-color" 
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input 
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1"
                    placeholder="#0B1E3D"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    id="text-color" 
                    type="color"
                    defaultValue="#000000"
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input 
                    type="text"
                    defaultValue="#000000"
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Label className="mb-2 block">Preview</Label>
                <div className="border rounded-lg p-6 space-y-2">
                  <div 
                    className="h-12 rounded-md flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary Color
                  </div>
                  <div 
                    className="h-12 rounded-md flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Secondary Color
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={handleQuotationSettingsSave} size="lg">
              Save Quotation Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
