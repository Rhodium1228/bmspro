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
  const [footerText, setFooterText] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#1D8FCC");
  const [secondaryColor, setSecondaryColor] = useState("#0B1E3D");
  const [settingsLoading, setSettingsLoading] = useState(false);

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

  /**
   * Fetch quotation settings from database
   */
  const { data: quotationSettings, isLoading: loadingQuotationSettings } = useQuery({
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

  /**
   * Load quotation settings into form when fetched
   */
  useEffect(() => {
    if (quotationSettings) {
      setSelectedTemplate(quotationSettings.template || "modern");
      setSelectedFont(quotationSettings.font || "inter");
      setHeaderText(quotationSettings.header_text || "");
      setFooterText(quotationSettings.footer_text || "");
      setPrimaryColor(quotationSettings.primary_color || "#1D8FCC");
      setSecondaryColor(quotationSettings.secondary_color || "#0B1E3D");
      setLogoPreview(quotationSettings.logo_url || null);
    }
  }, [quotationSettings]);

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
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        showToast({
          title: "Invalid file type",
          description: "Please upload an image (JPG, PNG, GIF, WEBP) or PDF file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setLogo(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      
      showToast({
        title: "Logo selected",
        description: "Logo will be uploaded when you save settings.",
      });
    }
  };

  /**
   * Handle quotation settings save
   */
  const handleQuotationSettingsSave = async () => {
    try {
      setSettingsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let logoUrl = logoPreview;

      // Upload logo if a new file is selected
      if (logo) {
        const fileExt = logo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('quotation-logos')
          .upload(fileName, logo, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('quotation-logos')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      const settingsData = {
        user_id: user.id,
        template: selectedTemplate,
        font: selectedFont,
        header_text: headerText,
        footer_text: footerText,
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      };

      // Check if settings exist
      if (quotationSettings) {
        const { error } = await supabase
          .from('quotation_settings')
          .update(settingsData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('quotation_settings')
          .insert(settingsData);

        if (error) throw error;
      }

      toast.success("Quotation settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ['quotation-settings'] });
      setLogo(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save quotation settings");
    } finally {
      setSettingsLoading(false);
    }
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
                <p className="text-sm text-muted-foreground">Choose a template style for your quotations</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Modern Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedTemplate === "modern" ? "ring-2 ring-primary shadow-lg" : ""}`}
                    onClick={() => setSelectedTemplate("modern")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg mb-3 overflow-hidden border border-gray-200 text-[4px]">
                        <div className="h-full p-2">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-1.5 rounded mb-1.5">
                            <div className="flex justify-between items-start">
                              <div className="w-1/2">
                                <div className="h-1 bg-white/90 w-3/4 mb-0.5"></div>
                                <div className="h-0.5 bg-white/70 w-1/2"></div>
                              </div>
                              <div className="w-4 h-4 bg-white/20 rounded"></div>
                            </div>
                          </div>
                          {/* Tax Invoice Title */}
                          <div className="bg-blue-500/10 py-0.5 mb-1">
                            <div className="h-1 bg-blue-600 w-1/3 mx-auto"></div>
                          </div>
                          {/* Bill To Section */}
                          <div className="mb-1">
                            <div className="h-0.5 bg-gray-800 w-1/4 mb-0.5"></div>
                            <div className="h-0.5 bg-gray-400 w-1/3"></div>
                          </div>
                          {/* Invoice Details Table */}
                          <div className="border border-gray-300 mb-1">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="border-r border-b border-gray-300 p-0.5">
                                <div className="h-0.5 bg-gray-600 w-2/3"></div>
                              </div>
                              <div className="border-b border-gray-300 p-0.5">
                                <div className="h-0.5 bg-gray-400 w-3/4"></div>
                              </div>
                              <div className="border-r border-gray-300 p-0.5">
                                <div className="h-0.5 bg-gray-600 w-1/2"></div>
                              </div>
                              <div className="p-0.5">
                                <div className="h-0.5 bg-gray-400 w-2/3"></div>
                              </div>
                            </div>
                          </div>
                          {/* Items Table */}
                          <div className="border border-gray-300">
                            <div className="bg-blue-500 p-0.5 grid grid-cols-4 gap-0.5">
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                            </div>
                            <div className="p-0.5 space-y-0.5">
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base">Modern</h3>
                      <p className="text-xs text-muted-foreground">Clean gradients with bold headers</p>
                    </CardContent>
                  </Card>

                  {/* Classic Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedTemplate === "classic" ? "ring-2 ring-primary shadow-lg" : ""}`}
                    onClick={() => setSelectedTemplate("classic")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-white rounded-lg mb-3 overflow-hidden border-2 border-gray-800 text-[4px]">
                        <div className="h-full p-2">
                          {/* Header */}
                          <div className="bg-gray-800 text-white p-1.5 mb-1.5">
                            <div className="flex justify-between items-start">
                              <div className="w-1/2">
                                <div className="h-1 bg-white w-3/4 mb-0.5"></div>
                                <div className="h-0.5 bg-white/80 w-1/2"></div>
                              </div>
                              <div className="w-4 h-4 bg-white/20"></div>
                            </div>
                          </div>
                          {/* Tax Invoice Title */}
                          <div className="border-t-2 border-b-2 border-gray-800 py-0.5 mb-1">
                            <div className="h-1 bg-gray-800 w-1/3 mx-auto"></div>
                          </div>
                          {/* Bill To Section */}
                          <div className="mb-1">
                            <div className="h-0.5 bg-gray-800 w-1/4 mb-0.5"></div>
                            <div className="h-0.5 bg-gray-600 w-1/3"></div>
                          </div>
                          {/* Invoice Details Table */}
                          <div className="border-2 border-gray-800 mb-1">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="border-r-2 border-b-2 border-gray-800 p-0.5">
                                <div className="h-0.5 bg-gray-700 w-2/3"></div>
                              </div>
                              <div className="border-b-2 border-gray-800 p-0.5">
                                <div className="h-0.5 bg-gray-500 w-3/4"></div>
                              </div>
                              <div className="border-r-2 border-gray-800 p-0.5">
                                <div className="h-0.5 bg-gray-700 w-1/2"></div>
                              </div>
                              <div className="p-0.5">
                                <div className="h-0.5 bg-gray-500 w-2/3"></div>
                              </div>
                            </div>
                          </div>
                          {/* Items Table */}
                          <div className="border-2 border-gray-800">
                            <div className="bg-gray-800 p-0.5 grid grid-cols-4 gap-0.5">
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                            </div>
                            <div className="p-0.5 space-y-0.5">
                              <div className="h-0.5 bg-gray-400 w-full"></div>
                              <div className="h-0.5 bg-gray-400 w-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base">Classic</h3>
                      <p className="text-xs text-muted-foreground">Traditional business layout</p>
                    </CardContent>
                  </Card>

                  {/* Minimal Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedTemplate === "minimal" ? "ring-2 ring-primary shadow-lg" : ""}`}
                    onClick={() => setSelectedTemplate("minimal")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-white rounded-lg mb-3 overflow-hidden border border-gray-200 text-[4px]">
                        <div className="h-full p-2">
                          {/* Header */}
                          <div className="border-b border-gray-200 p-1.5 mb-1.5">
                            <div className="flex justify-between items-start">
                              <div className="w-1/2">
                                <div className="h-1 bg-gray-900 w-3/4 mb-0.5"></div>
                                <div className="h-0.5 bg-gray-500 w-1/2"></div>
                              </div>
                              <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                            </div>
                          </div>
                          {/* Tax Invoice Title */}
                          <div className="py-0.5 mb-1">
                            <div className="h-1 bg-gray-800 w-1/3 mx-auto rounded-full"></div>
                          </div>
                          {/* Bill To Section */}
                          <div className="mb-1">
                            <div className="h-0.5 bg-gray-700 w-1/4 mb-0.5"></div>
                            <div className="h-0.5 bg-gray-400 w-1/3"></div>
                          </div>
                          {/* Invoice Details Table */}
                          <div className="border border-gray-200 rounded mb-1">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="border-r border-b border-gray-200 p-0.5">
                                <div className="h-0.5 bg-gray-600 w-2/3"></div>
                              </div>
                              <div className="border-b border-gray-200 p-0.5">
                                <div className="h-0.5 bg-gray-400 w-3/4"></div>
                              </div>
                              <div className="border-r border-gray-200 p-0.5">
                                <div className="h-0.5 bg-gray-600 w-1/2"></div>
                              </div>
                              <div className="p-0.5">
                                <div className="h-0.5 bg-gray-400 w-2/3"></div>
                              </div>
                            </div>
                          </div>
                          {/* Items Table */}
                          <div className="border border-gray-200 rounded">
                            <div className="bg-gray-100 p-0.5 grid grid-cols-4 gap-0.5">
                              <div className="h-0.5 bg-gray-700 w-full"></div>
                              <div className="h-0.5 bg-gray-700 w-full"></div>
                              <div className="h-0.5 bg-gray-700 w-full"></div>
                              <div className="h-0.5 bg-gray-700 w-full"></div>
                            </div>
                            <div className="p-0.5 space-y-0.5">
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base">Minimal</h3>
                      <p className="text-xs text-muted-foreground">Simple and elegant design</p>
                    </CardContent>
                  </Card>

                  {/* Professional Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedTemplate === "professional" ? "ring-2 ring-primary shadow-lg" : ""}`}
                    onClick={() => setSelectedTemplate("professional")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gradient-to-b from-indigo-50 to-white rounded-lg mb-3 overflow-hidden border border-indigo-200 text-[4px]">
                        <div className="h-full p-2">
                          {/* Header */}
                          <div className="bg-white p-1.5 rounded shadow-sm mb-1.5">
                            <div className="flex justify-between items-start">
                              <div className="w-1/2">
                                <div className="h-1 bg-indigo-600 w-3/4 mb-0.5"></div>
                                <div className="h-0.5 bg-indigo-400 w-1/2"></div>
                              </div>
                              <div className="w-4 h-4 bg-indigo-600 rounded-full"></div>
                            </div>
                          </div>
                          {/* Tax Invoice Title */}
                          <div className="bg-indigo-600/10 py-0.5 mb-1 rounded">
                            <div className="h-1 bg-indigo-600 w-1/3 mx-auto"></div>
                          </div>
                          {/* Bill To Section */}
                          <div className="mb-1 bg-white p-1 rounded shadow-sm">
                            <div className="h-0.5 bg-indigo-800 w-1/4 mb-0.5"></div>
                            <div className="h-0.5 bg-gray-500 w-1/3"></div>
                          </div>
                          {/* Invoice Details Table */}
                          <div className="border border-indigo-200 rounded mb-1 bg-white">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="border-r border-b border-indigo-200 p-0.5">
                                <div className="h-0.5 bg-indigo-600 w-2/3"></div>
                              </div>
                              <div className="border-b border-indigo-200 p-0.5">
                                <div className="h-0.5 bg-gray-500 w-3/4"></div>
                              </div>
                              <div className="border-r border-indigo-200 p-0.5">
                                <div className="h-0.5 bg-indigo-600 w-1/2"></div>
                              </div>
                              <div className="p-0.5">
                                <div className="h-0.5 bg-gray-500 w-2/3"></div>
                              </div>
                            </div>
                          </div>
                          {/* Items Table */}
                          <div className="border border-indigo-200 rounded bg-white shadow-sm">
                            <div className="bg-indigo-600 p-0.5 grid grid-cols-4 gap-0.5 rounded-t">
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                            </div>
                            <div className="p-0.5 space-y-0.5">
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base">Professional</h3>
                      <p className="text-xs text-muted-foreground">Corporate style with logo prominence</p>
                    </CardContent>
                  </Card>

                  {/* Bold Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedTemplate === "bold" ? "ring-2 ring-primary shadow-lg" : ""}`}
                    onClick={() => setSelectedTemplate("bold")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-lg mb-3 overflow-hidden text-[4px]">
                        <div className="h-full p-2">
                          {/* Header */}
                          <div className="bg-white/95 p-1.5 rounded-lg shadow-lg mb-1.5">
                            <div className="flex justify-between items-start">
                              <div className="w-1/2">
                                <div className="h-1 bg-purple-600 w-3/4 mb-0.5"></div>
                                <div className="h-0.5 bg-purple-400 w-1/2"></div>
                              </div>
                              <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg"></div>
                            </div>
                          </div>
                          {/* Tax Invoice Title */}
                          <div className="bg-white/90 py-0.5 mb-1 rounded shadow">
                            <div className="h-1 bg-purple-600 w-1/3 mx-auto"></div>
                          </div>
                          {/* Bill To Section */}
                          <div className="mb-1 bg-white/90 p-1 rounded shadow">
                            <div className="h-0.5 bg-purple-700 w-1/4 mb-0.5"></div>
                            <div className="h-0.5 bg-gray-600 w-1/3"></div>
                          </div>
                          {/* Invoice Details Table */}
                          <div className="border border-white/50 rounded mb-1 bg-white/90">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="border-r border-b border-purple-200 p-0.5">
                                <div className="h-0.5 bg-purple-600 w-2/3"></div>
                              </div>
                              <div className="border-b border-purple-200 p-0.5">
                                <div className="h-0.5 bg-gray-500 w-3/4"></div>
                              </div>
                              <div className="border-r border-purple-200 p-0.5">
                                <div className="h-0.5 bg-purple-600 w-1/2"></div>
                              </div>
                              <div className="p-0.5">
                                <div className="h-0.5 bg-gray-500 w-2/3"></div>
                              </div>
                            </div>
                          </div>
                          {/* Items Table */}
                          <div className="border border-white/50 rounded bg-white/90 shadow">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-0.5 grid grid-cols-4 gap-0.5 rounded-t">
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                            </div>
                            <div className="p-0.5 space-y-0.5">
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base">Bold</h3>
                      <p className="text-xs text-muted-foreground">Vibrant gradient for creative businesses</p>
                    </CardContent>
                  </Card>

                  {/* Corporate Blue Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedTemplate === "corporate-blue" ? "ring-2 ring-primary shadow-lg" : ""}`}
                    onClick={() => setSelectedTemplate("corporate-blue")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-white rounded-lg mb-3 overflow-hidden border-t-4 border-blue-700 shadow text-[4px]">
                        <div className="h-full p-2">
                          {/* Header */}
                          <div className="border-b-2 border-blue-700 p-1.5 mb-1.5">
                            <div className="flex justify-between items-start">
                              <div className="w-1/2">
                                <div className="h-1 bg-blue-700 w-3/4 mb-0.5"></div>
                                <div className="h-0.5 bg-blue-500 w-1/2"></div>
                              </div>
                              <div className="w-4 h-4 border-2 border-blue-700"></div>
                            </div>
                          </div>
                          {/* Tax Invoice Title */}
                          <div className="bg-blue-50 py-0.5 mb-1">
                            <div className="h-1 bg-blue-700 w-1/3 mx-auto"></div>
                          </div>
                          {/* Bill To Section */}
                          <div className="mb-1">
                            <div className="h-0.5 bg-blue-800 w-1/4 mb-0.5"></div>
                            <div className="h-0.5 bg-gray-600 w-1/3"></div>
                          </div>
                          {/* Invoice Details Table */}
                          <div className="border-2 border-blue-200 mb-1">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="border-r-2 border-b-2 border-blue-200 p-0.5 bg-blue-50">
                                <div className="h-0.5 bg-blue-700 w-2/3"></div>
                              </div>
                              <div className="border-b-2 border-blue-200 p-0.5">
                                <div className="h-0.5 bg-gray-600 w-3/4"></div>
                              </div>
                              <div className="border-r-2 border-blue-200 p-0.5 bg-blue-50">
                                <div className="h-0.5 bg-blue-700 w-1/2"></div>
                              </div>
                              <div className="p-0.5">
                                <div className="h-0.5 bg-gray-600 w-2/3"></div>
                              </div>
                            </div>
                          </div>
                          {/* Items Table */}
                          <div className="border-2 border-blue-200">
                            <div className="bg-blue-700 p-0.5 grid grid-cols-4 gap-0.5">
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                            </div>
                            <div className="p-0.5 space-y-0.5">
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base">Corporate Blue</h3>
                      <p className="text-xs text-muted-foreground">Professional blue theme for corporate</p>
                    </CardContent>
                  </Card>

                  {/* Tech Startup Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedTemplate === "tech-startup" ? "ring-2 ring-primary shadow-lg" : ""}`}
                    onClick={() => setSelectedTemplate("tech-startup")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg mb-3 overflow-hidden text-[4px]">
                        <div className="h-full p-2">
                          {/* Header */}
                          <div className="border-b border-emerald-500/50 p-1.5 mb-1.5">
                            <div className="flex justify-between items-start">
                              <div className="w-1/2">
                                <div className="h-1 bg-emerald-400 w-3/4 mb-0.5"></div>
                                <div className="h-0.5 bg-emerald-300 w-1/2"></div>
                              </div>
                              <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                            </div>
                          </div>
                          {/* Tax Invoice Title */}
                          <div className="bg-emerald-500/10 border border-emerald-500/30 py-0.5 mb-1 rounded">
                            <div className="h-1 bg-emerald-400 w-1/3 mx-auto"></div>
                          </div>
                          {/* Bill To Section */}
                          <div className="mb-1 border-l-2 border-emerald-500 pl-1">
                            <div className="h-0.5 bg-emerald-300 w-1/4 mb-0.5"></div>
                            <div className="h-0.5 bg-slate-400 w-1/3"></div>
                          </div>
                          {/* Invoice Details Table */}
                          <div className="border border-slate-700 rounded mb-1 bg-slate-800/50">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="border-r border-b border-slate-700 p-0.5">
                                <div className="h-0.5 bg-emerald-400 w-2/3"></div>
                              </div>
                              <div className="border-b border-slate-700 p-0.5">
                                <div className="h-0.5 bg-slate-300 w-3/4"></div>
                              </div>
                              <div className="border-r border-slate-700 p-0.5">
                                <div className="h-0.5 bg-emerald-400 w-1/2"></div>
                              </div>
                              <div className="p-0.5">
                                <div className="h-0.5 bg-slate-300 w-2/3"></div>
                              </div>
                            </div>
                          </div>
                          {/* Items Table */}
                          <div className="border border-emerald-500/30 rounded bg-slate-800/50">
                            <div className="bg-emerald-500 p-0.5 grid grid-cols-4 gap-0.5 rounded-t">
                              <div className="h-0.5 bg-slate-900 w-full"></div>
                              <div className="h-0.5 bg-slate-900 w-full"></div>
                              <div className="h-0.5 bg-slate-900 w-full"></div>
                              <div className="h-0.5 bg-slate-900 w-full"></div>
                            </div>
                            <div className="p-0.5 space-y-0.5">
                              <div className="h-0.5 bg-slate-600 w-full"></div>
                              <div className="h-0.5 bg-slate-600 w-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base">Tech Startup</h3>
                      <p className="text-xs text-muted-foreground">Modern dark theme with accent colors</p>
                    </CardContent>
                  </Card>

                  {/* Elegant Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedTemplate === "elegant" ? "ring-2 ring-primary shadow-lg" : ""}`}
                    onClick={() => setSelectedTemplate("elegant")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gradient-to-b from-amber-50 to-white rounded-lg mb-3 overflow-hidden border border-amber-200 text-[4px]">
                        <div className="h-full p-2">
                          {/* Header */}
                          <div className="border-b-2 border-amber-300 p-1.5 mb-1.5">
                            <div className="flex justify-between items-start">
                              <div className="w-1/2">
                                <div className="h-1 bg-amber-700 w-3/4 mb-0.5"></div>
                                <div className="h-0.5 bg-amber-500 w-1/2"></div>
                              </div>
                              <div className="w-4 h-4 border-2 border-amber-400 rounded-full bg-amber-50"></div>
                            </div>
                          </div>
                          {/* Tax Invoice Title */}
                          <div className="py-0.5 mb-1">
                            <div className="h-1 bg-amber-700 w-1/3 mx-auto border-b-2 border-amber-300"></div>
                          </div>
                          {/* Bill To Section */}
                          <div className="mb-1 bg-white border-l-4 border-amber-400 pl-1 py-0.5">
                            <div className="h-0.5 bg-amber-800 w-1/4 mb-0.5"></div>
                            <div className="h-0.5 bg-gray-600 w-1/3"></div>
                          </div>
                          {/* Invoice Details Table */}
                          <div className="border-2 border-amber-200 rounded mb-1 bg-white">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="border-r-2 border-b-2 border-amber-200 p-0.5">
                                <div className="h-0.5 bg-amber-700 w-2/3"></div>
                              </div>
                              <div className="border-b-2 border-amber-200 p-0.5">
                                <div className="h-0.5 bg-gray-600 w-3/4"></div>
                              </div>
                              <div className="border-r-2 border-amber-200 p-0.5">
                                <div className="h-0.5 bg-amber-700 w-1/2"></div>
                              </div>
                              <div className="p-0.5">
                                <div className="h-0.5 bg-gray-600 w-2/3"></div>
                              </div>
                            </div>
                          </div>
                          {/* Items Table */}
                          <div className="border-2 border-amber-200 rounded bg-white">
                            <div className="bg-gradient-to-r from-amber-100 to-amber-50 p-0.5 grid grid-cols-4 gap-0.5 rounded-t border-b-2 border-amber-300">
                              <div className="h-0.5 bg-amber-800 w-full"></div>
                              <div className="h-0.5 bg-amber-800 w-full"></div>
                              <div className="h-0.5 bg-amber-800 w-full"></div>
                              <div className="h-0.5 bg-amber-800 w-full"></div>
                            </div>
                            <div className="p-0.5 space-y-0.5">
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base">Elegant</h3>
                      <p className="text-xs text-muted-foreground">Sophisticated gold accents</p>
                    </CardContent>
                  </Card>

                  {/* Creative Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedTemplate === "creative" ? "ring-2 ring-primary shadow-lg" : ""}`}
                    onClick={() => setSelectedTemplate("creative")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-white rounded-lg mb-3 overflow-hidden border-4 border-double border-orange-400 text-[4px]">
                        <div className="h-full p-2">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-1.5 rounded-lg mb-1.5">
                            <div className="flex justify-between items-start">
                              <div className="w-1/2">
                                <div className="h-1 bg-white w-3/4 mb-0.5"></div>
                                <div className="h-0.5 bg-white/80 w-1/2"></div>
                              </div>
                              <div className="w-4 h-4 bg-white rounded-full"></div>
                            </div>
                          </div>
                          {/* Tax Invoice Title */}
                          <div className="border-2 border-orange-400 rounded-full py-0.5 mb-1 bg-orange-50">
                            <div className="h-1 bg-orange-600 w-1/3 mx-auto rounded-full"></div>
                          </div>
                          {/* Bill To Section */}
                          <div className="mb-1 bg-gradient-to-r from-orange-50 to-pink-50 p-1 rounded-lg">
                            <div className="h-0.5 bg-orange-700 w-1/4 mb-0.5"></div>
                            <div className="h-0.5 bg-gray-600 w-1/3"></div>
                          </div>
                          {/* Invoice Details Table */}
                          <div className="border-2 border-orange-300 rounded-lg mb-1 overflow-hidden">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="border-r-2 border-b-2 border-orange-300 p-0.5 bg-orange-50">
                                <div className="h-0.5 bg-orange-600 w-2/3"></div>
                              </div>
                              <div className="border-b-2 border-orange-300 p-0.5 bg-pink-50">
                                <div className="h-0.5 bg-gray-600 w-3/4"></div>
                              </div>
                              <div className="border-r-2 border-orange-300 p-0.5 bg-pink-50">
                                <div className="h-0.5 bg-orange-600 w-1/2"></div>
                              </div>
                              <div className="p-0.5 bg-orange-50">
                                <div className="h-0.5 bg-gray-600 w-2/3"></div>
                              </div>
                            </div>
                          </div>
                          {/* Items Table */}
                          <div className="border-2 border-orange-300 rounded-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-0.5 grid grid-cols-4 gap-0.5">
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                              <div className="h-0.5 bg-white w-full"></div>
                            </div>
                            <div className="p-0.5 space-y-0.5 bg-gradient-to-br from-orange-50 to-pink-50">
                              <div className="h-0.5 bg-gray-400 w-full"></div>
                              <div className="h-0.5 bg-gray-400 w-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base">Creative</h3>
                      <p className="text-xs text-muted-foreground">Artistic with warm gradient colors</p>
                    </CardContent>
                  </Card>

                  {/* Warm Friendly Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedTemplate === "warm-friendly" ? "ring-2 ring-primary shadow-lg" : ""}`}
                    onClick={() => setSelectedTemplate("warm-friendly")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 rounded-2xl mb-3 overflow-hidden border-2 border-rose-200 text-[4px]">
                        <div className="h-full p-2">
                          {/* Header */}
                          <div className="bg-white/80 backdrop-blur p-1.5 rounded-xl shadow-sm mb-1.5">
                            <div className="flex justify-between items-start">
                              <div className="w-1/2">
                                <div className="h-1 bg-rose-600 w-3/4 mb-0.5 rounded-full"></div>
                                <div className="h-0.5 bg-orange-500 w-1/2 rounded-full"></div>
                              </div>
                              <div className="w-4 h-4 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full"></div>
                            </div>
                          </div>
                          {/* Tax Invoice Title */}
                          <div className="bg-white/60 py-0.5 mb-1 rounded-full">
                            <div className="h-1 bg-gradient-to-r from-rose-500 to-orange-500 w-1/3 mx-auto rounded-full"></div>
                          </div>
                          {/* Bill To Section */}
                          <div className="mb-1 bg-white/60 p-1 rounded-xl">
                            <div className="h-0.5 bg-rose-700 w-1/4 mb-0.5 rounded-full"></div>
                            <div className="h-0.5 bg-gray-600 w-1/3 rounded-full"></div>
                          </div>
                          {/* Invoice Details Table */}
                          <div className="border border-rose-200 rounded-xl mb-1 bg-white/60 overflow-hidden">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="border-r border-b border-rose-200 p-0.5">
                                <div className="h-0.5 bg-rose-600 w-2/3 rounded-full"></div>
                              </div>
                              <div className="border-b border-rose-200 p-0.5">
                                <div className="h-0.5 bg-gray-500 w-3/4 rounded-full"></div>
                              </div>
                              <div className="border-r border-rose-200 p-0.5">
                                <div className="h-0.5 bg-rose-600 w-1/2 rounded-full"></div>
                              </div>
                              <div className="p-0.5">
                                <div className="h-0.5 bg-gray-500 w-2/3 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                          {/* Items Table */}
                          <div className="border border-rose-200 rounded-xl bg-white/60 overflow-hidden">
                            <div className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 p-0.5 grid grid-cols-4 gap-0.5">
                              <div className="h-0.5 bg-white w-full rounded-full"></div>
                              <div className="h-0.5 bg-white w-full rounded-full"></div>
                              <div className="h-0.5 bg-white w-full rounded-full"></div>
                              <div className="h-0.5 bg-white w-full rounded-full"></div>
                            </div>
                            <div className="p-0.5 space-y-0.5">
                              <div className="h-0.5 bg-gray-300 w-full rounded-full"></div>
                              <div className="h-0.5 bg-gray-300 w-full rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base">Warm & Friendly</h3>
                      <p className="text-xs text-muted-foreground">Approachable design with soft colors</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fonts" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="font-select">Document Font</Label>
                <Select value={selectedFont} onValueChange={setSelectedFont}>
                  <SelectTrigger id="font-select">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="inter" style={{ fontFamily: 'Inter' }}>Inter</SelectItem>
                    <SelectItem value="roboto" style={{ fontFamily: 'Roboto' }}>Roboto</SelectItem>
                    <SelectItem value="opensans" style={{ fontFamily: 'Open Sans' }}>Open Sans</SelectItem>
                    <SelectItem value="lato" style={{ fontFamily: 'Lato' }}>Lato</SelectItem>
                    <SelectItem value="montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</SelectItem>
                    <SelectItem value="poppins" style={{ fontFamily: 'Poppins' }}>Poppins</SelectItem>
                    <SelectItem value="raleway" style={{ fontFamily: 'Raleway' }}>Raleway</SelectItem>
                    <SelectItem value="playfair" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</SelectItem>
                    <SelectItem value="merriweather" style={{ fontFamily: 'Merriweather' }}>Merriweather</SelectItem>
                    <SelectItem value="sourcesans" style={{ fontFamily: 'Source Sans Pro' }}>Source Sans Pro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  This font will be applied to all text in the quotation
                </p>
              </div>
            </TabsContent>

            <TabsContent value="header" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="header-text">Header Text</Label>
                <Textarea 
                  id="header-text"
                  placeholder="Enter header text or tagline (appears at the top of quotation)"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Add a custom message or tagline at the top of your quotations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer-text">Footer Text</Label>
                <Textarea 
                  id="footer-text"
                  placeholder="Enter footer text (appears at the bottom of quotation)"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Add payment details, contact information, or legal text
                </p>
              </div>
            </TabsContent>

            <TabsContent value="logo" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Company Logo</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    id="logo-upload" 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                    onChange={handleLogoUpload}
                    className="cursor-pointer"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload an image (JPG, PNG, GIF, WEBP) or PDF file. Max size: 5MB
                </p>
                {logo && (
                  <p className="text-sm text-success">
                    ✓ Selected: {logo.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Logo Preview</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 flex items-center justify-center bg-muted/20 min-h-[200px]">
                  {logoPreview ? (
                    logoPreview.endsWith('.pdf') ? (
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">PDF Logo Selected</p>
                      </div>
                    ) : (
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="max-h-40 object-contain"
                      />
                    )
                  ) : (
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No logo uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4 pt-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose colors that will be applied to your quotation template
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Standard Color Palette */}
                  {[
                    { name: 'Blue', primary: '#1D8FCC', secondary: '#0B1E3D' },
                    { name: 'Green', primary: '#10B981', secondary: '#047857' },
                    { name: 'Purple', primary: '#8B5CF6', secondary: '#6D28D9' },
                    { name: 'Red', primary: '#EF4444', secondary: '#B91C1C' },
                    { name: 'Orange', primary: '#F97316', secondary: '#C2410C' },
                    { name: 'Teal', primary: '#14B8A6', secondary: '#0F766E' },
                    { name: 'Indigo', primary: '#6366F1', secondary: '#4338CA' },
                    { name: 'Pink', primary: '#EC4899', secondary: '#BE185D' },
                  ].map((colorScheme) => (
                    <Card 
                      key={colorScheme.name}
                      className={`cursor-pointer transition-all ${
                        primaryColor === colorScheme.primary ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        setPrimaryColor(colorScheme.primary);
                        setSecondaryColor(colorScheme.secondary);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div 
                            className="h-16 rounded-md"
                            style={{ backgroundColor: colorScheme.primary }}
                          />
                          <div 
                            className="h-8 rounded-md"
                            style={{ backgroundColor: colorScheme.secondary }}
                          />
                          <p className="text-sm font-medium text-center">{colorScheme.name}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="pt-4 space-y-4 border-t">
                  <h4 className="font-medium">Custom Colors</h4>
                  
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
                </div>

                <div className="pt-4 border-t">
                  <Label className="mb-3 block">Color Preview</Label>
                  <div className="border rounded-lg p-6 space-y-3">
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
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleQuotationSettingsSave} 
              size="lg"
              disabled={settingsLoading || loadingQuotationSettings}
            >
              {settingsLoading ? "Saving..." : "Save Quotation Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
