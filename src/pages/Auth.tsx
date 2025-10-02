// ===== IMPORTS =====
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Mail, Lock, Building2, User, Phone } from "lucide-react";
import logo from "@/assets/bms-pro-logo.jpg";

// ===== CONSTANTS =====
/**
 * Supported country codes with flags for mobile number input
 */
const countryCodes = [
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+91", country: "India", flag: "🇮🇳" },
];

/**
 * Auth Component
 * 
 * Handles user authentication with:
 * - Sign in with email/password or Google
 * - Sign up with extended profile information
 * - Company details, username, mobile number
 * - Password confirmation
 * - Merchant account option
 */
export default function Auth() {
  // ===== STATE - Authentication =====
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // ===== STATE - Sign Up Fields =====
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [countryCode, setCountryCode] = useState("+61"); // Default to Australia
  const [mobileNumber, setMobileNumber] = useState("");
  const [joinAsMerchant, setJoinAsMerchant] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle authentication (Sign In / Sign Up)
   * Validates all required fields and creates account with user metadata
   */
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Sign up specific validation
    if (isSignUp) {
      if (!companyName || !username || !mobileNumber) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      // Validate mobile number (basic validation)
      if (mobileNumber.length < 8) {
        toast.error("Please enter a valid mobile number");
        return;
      }
    }

    try {
      setLoading(true);

      if (isSignUp) {
        // Sign up with user metadata
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              company_name: companyName,
              username: username,
              country_code: countryCode,
              mobile_number: mobileNumber,
              full_phone: `${countryCode} ${mobileNumber}`,
              is_merchant: joinAsMerchant,
            },
          },
        });

        if (error) throw error;
        toast.success("Check your email for the confirmation link");
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Signed in successfully");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER =====
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        {/* Header with logo and title */}
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={logo} alt="BMS PRO" className="h-16 object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to BMS PRO</CardTitle>
            <CardDescription>
              {isSignUp ? "Create your account to get started" : "Sign in to your account"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full gap-2"
            variant="outline"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Authentication Form */}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Sign Up Fields - Only shown when creating account */}
            {isSignUp && (
              <>
                {/* Company Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Enter company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-9"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-9"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field - Always shown */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Mobile Number Field - Only shown for sign up */}
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Country Code Selector */}
                  <Select
                    value={countryCode}
                    onValueChange={setCountryCode}
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
                      id="mobileNumber"
                      type="tel"
                      placeholder="Enter mobile number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="pl-9"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password Field - Always shown */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  disabled={loading}
                  required
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            {/* Confirm Password Field - Only shown for sign up */}
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            )}

            {/* Merchant Option - Only shown for sign up */}
            {isSignUp && (
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="merchant"
                  checked={joinAsMerchant}
                  onCheckedChange={(checked) => setJoinAsMerchant(checked as boolean)}
                  disabled={loading}
                />
                <Label
                  htmlFor="merchant"
                  className="text-sm font-normal cursor-pointer"
                >
                  Join BMS Pro as merchant
                </Label>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
              disabled={loading}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
