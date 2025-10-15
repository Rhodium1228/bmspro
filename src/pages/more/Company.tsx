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
                <p className="text-sm text-muted-foreground">Choose a template style for your quotations. Click to see a detailed preview.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Modern Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-xl ${selectedTemplate === "modern" ? "ring-2 ring-primary shadow-xl" : ""}`}
                    onClick={() => setSelectedTemplate("modern")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-white rounded-lg mb-3 overflow-hidden border-2 border-blue-100 shadow-md">
                        <div className="h-full flex flex-col text-[6px] leading-tight">
                          {/* Header with gradient */}
                          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-[8px] mb-0.5">ACME CORPORATION</div>
                                <div className="text-[5px] opacity-90">123 Business St, City</div>
                              </div>
                              <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center text-[6px]">LOGO</div>
                            </div>
                          </div>
                          
                          {/* QUOTATION Title */}
                          <div className="bg-blue-50 py-2 text-center">
                            <div className="font-bold text-blue-700 text-[10px]">QUOTATION</div>
                          </div>
                          
                          <div className="flex-1 px-3 py-2 space-y-2">
                            {/* Bill To */}
                            <div className="text-[6px]">
                              <div className="font-semibold text-gray-700">Bill To:</div>
                              <div className="text-gray-600">John Smith</div>
                              <div className="text-gray-500 text-[5px]">456 Client Ave</div>
                            </div>
                            
                            {/* Details */}
                            <div className="grid grid-cols-2 gap-1 text-[5px] border border-gray-200 rounded">
                              <div className="border-r border-b border-gray-200 px-1 py-0.5 bg-gray-50">
                                <div className="font-semibold">Quote #:</div>
                              </div>
                              <div className="border-b border-gray-200 px-1 py-0.5">
                                <div>QT-2025-001</div>
                              </div>
                              <div className="border-r border-gray-200 px-1 py-0.5 bg-gray-50">
                                <div className="font-semibold">Date:</div>
                              </div>
                              <div className="px-1 py-0.5">
                                <div>15 Oct 2025</div>
                              </div>
                            </div>
                            
                            {/* Items Table */}
                            <div className="border border-gray-300 rounded overflow-hidden">
                              <div className="bg-blue-600 text-white px-1 py-0.5 grid grid-cols-4 gap-1 font-semibold text-[5px]">
                                <div className="col-span-2">Item</div>
                                <div className="text-right">Qty</div>
                                <div className="text-right">Price</div>
                              </div>
                              <div className="px-1 py-0.5 text-[5px] bg-gray-50">
                                <div className="grid grid-cols-4 gap-1 border-b border-gray-200 pb-0.5">
                                  <div className="col-span-2">Product Name</div>
                                  <div className="text-right">2</div>
                                  <div className="text-right">$100</div>
                                </div>
                                <div className="grid grid-cols-4 gap-1 pt-0.5">
                                  <div className="col-span-2">Service Item</div>
                                  <div className="text-right">1</div>
                                  <div className="text-right">$200</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Total */}
                            <div className="flex justify-end">
                              <div className="bg-blue-100 px-2 py-1 rounded text-[6px]">
                                <span className="font-semibold text-blue-700">Total: </span>
                                <span className="font-bold text-blue-900">$300.00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base mb-1">Modern</h3>
                      <p className="text-xs text-muted-foreground">Clean blue gradient with professional layout</p>
                    </CardContent>
                  </Card>

                  {/* Classic Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-xl ${selectedTemplate === "classic" ? "ring-2 ring-primary shadow-xl" : ""}`}
                    onClick={() => setSelectedTemplate("classic")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-white rounded-lg mb-3 overflow-hidden border-4 border-gray-900 shadow-md">
                        <div className="h-full flex flex-col text-[6px] leading-tight">
                          {/* Header */}
                          <div className="bg-gray-900 text-white px-3 py-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-[8px] mb-0.5">CLASSIC BUSINESS</div>
                                <div className="text-[5px]">Traditional Excellence Since 1990</div>
                              </div>
                              <div className="w-8 h-8 bg-white/20 flex items-center justify-center text-[6px]">LOGO</div>
                            </div>
                          </div>
                          
                          {/* QUOTATION Title */}
                          <div className="border-y-2 border-gray-900 py-2 text-center">
                            <div className="font-bold text-gray-900 text-[10px]">QUOTATION</div>
                          </div>
                          
                          <div className="flex-1 px-3 py-2 space-y-2">
                            {/* Bill To */}
                            <div className="text-[6px]">
                              <div className="font-bold text-gray-900">Bill To:</div>
                              <div className="text-gray-700">John Smith</div>
                              <div className="text-gray-600 text-[5px]">456 Client Ave</div>
                            </div>
                            
                            {/* Details */}
                            <div className="grid grid-cols-2 gap-1 text-[5px] border-2 border-gray-900">
                              <div className="border-r-2 border-b-2 border-gray-900 px-1 py-0.5 bg-gray-100">
                                <div className="font-bold">Quote #:</div>
                              </div>
                              <div className="border-b-2 border-gray-900 px-1 py-0.5">
                                <div>QT-2025-001</div>
                              </div>
                              <div className="border-r-2 border-gray-900 px-1 py-0.5 bg-gray-100">
                                <div className="font-bold">Date:</div>
                              </div>
                              <div className="px-1 py-0.5">
                                <div>15 Oct 2025</div>
                              </div>
                            </div>
                            
                            {/* Items Table */}
                            <div className="border-2 border-gray-900">
                              <div className="bg-gray-900 text-white px-1 py-0.5 grid grid-cols-4 gap-1 font-bold text-[5px]">
                                <div className="col-span-2">Item</div>
                                <div className="text-right">Qty</div>
                                <div className="text-right">Price</div>
                              </div>
                              <div className="px-1 py-0.5 text-[5px]">
                                <div className="grid grid-cols-4 gap-1 border-b border-gray-400 pb-0.5">
                                  <div className="col-span-2">Product Name</div>
                                  <div className="text-right">2</div>
                                  <div className="text-right">$100</div>
                                </div>
                                <div className="grid grid-cols-4 gap-1 pt-0.5">
                                  <div className="col-span-2">Service Item</div>
                                  <div className="text-right">1</div>
                                  <div className="text-right">$200</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Total */}
                            <div className="flex justify-end">
                              <div className="bg-gray-900 text-white px-2 py-1 text-[6px]">
                                <span className="font-bold">Total: $300.00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base mb-1">Classic</h3>
                      <p className="text-xs text-muted-foreground">Traditional black & white business style</p>
                    </CardContent>
                  </Card>

                  {/* Minimal Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-xl ${selectedTemplate === "minimal" ? "ring-2 ring-primary shadow-xl" : ""}`}
                    onClick={() => setSelectedTemplate("minimal")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-white rounded-lg mb-3 overflow-hidden border border-gray-200 shadow-md">
                        <div className="h-full flex flex-col text-[6px] leading-tight">
                          {/* Header */}
                          <div className="border-b border-gray-200 px-3 py-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-gray-900 text-[8px] mb-0.5">Minimal Design Co.</div>
                                <div className="text-gray-500 text-[5px]">Less is More</div>
                              </div>
                              <div className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-[5px] text-gray-400">Logo</div>
                            </div>
                          </div>
                          
                          {/* QUOTATION Title */}
                          <div className="py-2 text-center">
                            <div className="inline-block font-bold text-gray-800 text-[10px] border-b-2 border-gray-800">QUOTATION</div>
                          </div>
                          
                          <div className="flex-1 px-3 py-2 space-y-2">
                            {/* Bill To */}
                            <div className="text-[6px]">
                              <div className="font-semibold text-gray-700 mb-0.5">Bill To:</div>
                              <div className="text-gray-600">John Smith</div>
                              <div className="text-gray-500 text-[5px]">456 Client Ave</div>
                            </div>
                            
                            {/* Details */}
                            <div className="grid grid-cols-2 gap-1 text-[5px] border border-gray-200 rounded">
                              <div className="border-r border-b border-gray-200 px-1 py-0.5">
                                <div className="font-semibold text-gray-600">Quote #:</div>
                              </div>
                              <div className="border-b border-gray-200 px-1 py-0.5">
                                <div className="text-gray-700">QT-2025-001</div>
                              </div>
                              <div className="border-r border-gray-200 px-1 py-0.5">
                                <div className="font-semibold text-gray-600">Date:</div>
                              </div>
                              <div className="px-1 py-0.5">
                                <div className="text-gray-700">15 Oct 2025</div>
                              </div>
                            </div>
                            
                            {/* Items Table */}
                            <div className="border border-gray-200 rounded overflow-hidden">
                              <div className="bg-gray-100 px-1 py-0.5 grid grid-cols-4 gap-1 font-semibold text-gray-700 text-[5px]">
                                <div className="col-span-2">Item</div>
                                <div className="text-right">Qty</div>
                                <div className="text-right">Price</div>
                              </div>
                              <div className="px-1 py-0.5 text-[5px]">
                                <div className="grid grid-cols-4 gap-1 border-b border-gray-100 pb-0.5 text-gray-600">
                                  <div className="col-span-2">Product Name</div>
                                  <div className="text-right">2</div>
                                  <div className="text-right">$100</div>
                                </div>
                                <div className="grid grid-cols-4 gap-1 pt-0.5 text-gray-600">
                                  <div className="col-span-2">Service Item</div>
                                  <div className="text-right">1</div>
                                  <div className="text-right">$200</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Total */}
                            <div className="flex justify-end">
                              <div className="border-t-2 border-gray-800 pt-1 text-[6px]">
                                <span className="text-gray-600">Total: </span>
                                <span className="font-bold text-gray-900">$300.00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base mb-1">Minimal</h3>
                      <p className="text-xs text-muted-foreground">Clean and simple with subtle borders</p>
                    </CardContent>
                  </Card>

                  {/* Professional Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-xl ${selectedTemplate === "professional" ? "ring-2 ring-primary shadow-xl" : ""}`}
                    onClick={() => setSelectedTemplate("professional")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gradient-to-b from-indigo-50 to-white rounded-lg mb-3 overflow-hidden border border-indigo-200 shadow-md">
                        <div className="h-full flex flex-col text-[6px] leading-tight">
                          {/* Header */}
                          <div className="bg-white mx-2 mt-2 rounded-lg shadow-sm px-3 py-2 border border-indigo-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-indigo-700 text-[8px] mb-0.5">PROFESSIONAL CORP</div>
                                <div className="text-indigo-500 text-[5px]">Excellence in Every Detail</div>
                              </div>
                              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[5px]">LOGO</div>
                            </div>
                          </div>
                          
                          {/* QUOTATION Title */}
                          <div className="bg-indigo-100 mx-2 mt-2 py-2 text-center rounded">
                            <div className="font-bold text-indigo-700 text-[10px]">QUOTATION</div>
                          </div>
                          
                          <div className="flex-1 px-3 py-2 space-y-2">
                            {/* Bill To */}
                            <div className="bg-white rounded shadow-sm px-2 py-1 border border-indigo-100">
                              <div className="text-[6px]">
                                <div className="font-semibold text-indigo-700">Bill To:</div>
                                <div className="text-gray-700">John Smith</div>
                                <div className="text-gray-500 text-[5px]">456 Client Ave</div>
                              </div>
                            </div>
                            
                            {/* Details */}
                            <div className="grid grid-cols-2 gap-1 text-[5px] border border-indigo-200 rounded overflow-hidden bg-white">
                              <div className="border-r border-b border-indigo-200 px-1 py-0.5 bg-indigo-50">
                                <div className="font-semibold text-indigo-700">Quote #:</div>
                              </div>
                              <div className="border-b border-indigo-200 px-1 py-0.5">
                                <div className="text-gray-700">QT-2025-001</div>
                              </div>
                              <div className="border-r border-indigo-200 px-1 py-0.5 bg-indigo-50">
                                <div className="font-semibold text-indigo-700">Date:</div>
                              </div>
                              <div className="px-1 py-0.5">
                                <div className="text-gray-700">15 Oct 2025</div>
                              </div>
                            </div>
                            
                            {/* Items Table */}
                            <div className="border border-indigo-200 rounded overflow-hidden bg-white shadow-sm">
                              <div className="bg-indigo-600 text-white px-1 py-0.5 grid grid-cols-4 gap-1 font-semibold text-[5px]">
                                <div className="col-span-2">Item</div>
                                <div className="text-right">Qty</div>
                                <div className="text-right">Price</div>
                              </div>
                              <div className="px-1 py-0.5 text-[5px]">
                                <div className="grid grid-cols-4 gap-1 border-b border-gray-100 pb-0.5 text-gray-600">
                                  <div className="col-span-2">Product Name</div>
                                  <div className="text-right">2</div>
                                  <div className="text-right">$100</div>
                                </div>
                                <div className="grid grid-cols-4 gap-1 pt-0.5 text-gray-600">
                                  <div className="col-span-2">Service Item</div>
                                  <div className="text-right">1</div>
                                  <div className="text-right">$200</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Total */}
                            <div className="flex justify-end">
                              <div className="bg-indigo-600 text-white px-2 py-1 rounded shadow text-[6px]">
                                <span className="font-bold">Total: $300.00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base mb-1">Professional</h3>
                      <p className="text-xs text-muted-foreground">Corporate indigo theme with cards</p>
                    </CardContent>
                  </Card>

                  {/* Corporate Blue Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-xl ${selectedTemplate === "corporate-blue" ? "ring-2 ring-primary shadow-xl" : ""}`}
                    onClick={() => setSelectedTemplate("corporate-blue")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-white rounded-lg mb-3 overflow-hidden border-t-4 border-blue-700 shadow-md">
                        <div className="h-full flex flex-col text-[6px] leading-tight">
                          {/* Header */}
                          <div className="border-b-2 border-blue-700 px-3 py-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-blue-800 text-[8px] mb-0.5">BLUE CORPORATE</div>
                                <div className="text-blue-600 text-[5px]">Trusted Business Partner</div>
                              </div>
                              <div className="w-8 h-8 border-2 border-blue-700 flex items-center justify-center text-[5px] text-blue-700">LOGO</div>
                            </div>
                          </div>
                          
                          {/* QUOTATION Title */}
                          <div className="bg-blue-50 py-2 text-center">
                            <div className="font-bold text-blue-800 text-[10px]">QUOTATION</div>
                          </div>
                          
                          <div className="flex-1 px-3 py-2 space-y-2">
                            {/* Bill To */}
                            <div className="text-[6px]">
                              <div className="font-bold text-blue-800">Bill To:</div>
                              <div className="text-gray-700">John Smith</div>
                              <div className="text-gray-600 text-[5px]">456 Client Ave</div>
                            </div>
                            
                            {/* Details */}
                            <div className="grid grid-cols-2 gap-1 text-[5px] border-2 border-blue-200">
                              <div className="border-r-2 border-b-2 border-blue-200 px-1 py-0.5 bg-blue-50">
                                <div className="font-bold text-blue-700">Quote #:</div>
                              </div>
                              <div className="border-b-2 border-blue-200 px-1 py-0.5">
                                <div className="text-gray-700">QT-2025-001</div>
                              </div>
                              <div className="border-r-2 border-blue-200 px-1 py-0.5 bg-blue-50">
                                <div className="font-bold text-blue-700">Date:</div>
                              </div>
                              <div className="px-1 py-0.5">
                                <div className="text-gray-700">15 Oct 2025</div>
                              </div>
                            </div>
                            
                            {/* Items Table */}
                            <div className="border-2 border-blue-200">
                              <div className="bg-blue-700 text-white px-1 py-0.5 grid grid-cols-4 gap-1 font-bold text-[5px]">
                                <div className="col-span-2">Item</div>
                                <div className="text-right">Qty</div>
                                <div className="text-right">Price</div>
                              </div>
                              <div className="px-1 py-0.5 text-[5px]">
                                <div className="grid grid-cols-4 gap-1 border-b border-gray-200 pb-0.5 text-gray-600">
                                  <div className="col-span-2">Product Name</div>
                                  <div className="text-right">2</div>
                                  <div className="text-right">$100</div>
                                </div>
                                <div className="grid grid-cols-4 gap-1 pt-0.5 text-gray-600">
                                  <div className="col-span-2">Service Item</div>
                                  <div className="text-right">1</div>
                                  <div className="text-right">$200</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Total */}
                            <div className="flex justify-end">
                              <div className="bg-blue-100 border-2 border-blue-700 px-2 py-1 text-[6px]">
                                <span className="font-bold text-blue-800">Total: $300.00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base mb-1">Corporate Blue</h3>
                      <p className="text-xs text-muted-foreground">Professional blue with top border accent</p>
                    </CardContent>
                  </Card>

                  {/* Elegant Template */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-xl ${selectedTemplate === "elegant" ? "ring-2 ring-primary shadow-xl" : ""}`}
                    onClick={() => setSelectedTemplate("elegant")}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gradient-to-b from-amber-50 to-white rounded-lg mb-3 overflow-hidden border border-amber-200 shadow-md">
                        <div className="h-full flex flex-col text-[6px] leading-tight">
                          {/* Header */}
                          <div className="border-b-2 border-amber-300 px-3 py-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-amber-800 text-[8px] mb-0.5">ELEGANT SOLUTIONS</div>
                                <div className="text-amber-600 text-[5px]">Refined Excellence</div>
                              </div>
                              <div className="w-8 h-8 border-2 border-amber-400 rounded-full flex items-center justify-center text-amber-600 text-[5px] bg-amber-50">LOGO</div>
                            </div>
                          </div>
                          
                          {/* QUOTATION Title */}
                          <div className="py-2 text-center">
                            <div className="inline-block font-bold text-amber-800 text-[10px] border-b-2 border-amber-400 pb-0.5">QUOTATION</div>
                          </div>
                          
                          <div className="flex-1 px-3 py-2 space-y-2">
                            {/* Bill To */}
                            <div className="bg-white border-l-4 border-amber-400 pl-2 py-1 text-[6px]">
                              <div className="font-semibold text-amber-800">Bill To:</div>
                              <div className="text-gray-700">John Smith</div>
                              <div className="text-gray-600 text-[5px]">456 Client Ave</div>
                            </div>
                            
                            {/* Details */}
                            <div className="grid grid-cols-2 gap-1 text-[5px] border-2 border-amber-200 rounded bg-white">
                              <div className="border-r-2 border-b-2 border-amber-200 px-1 py-0.5">
                                <div className="font-semibold text-amber-700">Quote #:</div>
                              </div>
                              <div className="border-b-2 border-amber-200 px-1 py-0.5">
                                <div className="text-gray-700">QT-2025-001</div>
                              </div>
                              <div className="border-r-2 border-amber-200 px-1 py-0.5">
                                <div className="font-semibold text-amber-700">Date:</div>
                              </div>
                              <div className="px-1 py-0.5">
                                <div className="text-gray-700">15 Oct 2025</div>
                              </div>
                            </div>
                            
                            {/* Items Table */}
                            <div className="border-2 border-amber-200 rounded bg-white">
                              <div className="bg-gradient-to-r from-amber-100 to-amber-50 px-1 py-0.5 grid grid-cols-4 gap-1 font-semibold text-amber-800 text-[5px] border-b-2 border-amber-300">
                                <div className="col-span-2">Item</div>
                                <div className="text-right">Qty</div>
                                <div className="text-right">Price</div>
                              </div>
                              <div className="px-1 py-0.5 text-[5px]">
                                <div className="grid grid-cols-4 gap-1 border-b border-amber-100 pb-0.5 text-gray-600">
                                  <div className="col-span-2">Product Name</div>
                                  <div className="text-right">2</div>
                                  <div className="text-right">$100</div>
                                </div>
                                <div className="grid grid-cols-4 gap-1 pt-0.5 text-gray-600">
                                  <div className="col-span-2">Service Item</div>
                                  <div className="text-right">1</div>
                                  <div className="text-right">$200</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Total */}
                            <div className="flex justify-end">
                              <div className="bg-amber-100 border-l-4 border-amber-500 px-2 py-1 text-[6px]">
                                <span className="text-amber-700">Total: </span>
                                <span className="font-bold text-amber-900">$300.00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base mb-1">Elegant</h3>
                      <p className="text-xs text-muted-foreground">Sophisticated gold accents and borders</p>
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
