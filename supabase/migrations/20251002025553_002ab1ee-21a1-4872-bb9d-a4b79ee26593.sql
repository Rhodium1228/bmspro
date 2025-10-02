-- Create organization_profiles table to store company/user profile information
CREATE TABLE public.organization_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '+61',
  mobile_number TEXT NOT NULL,
  full_phone TEXT NOT NULL,
  is_merchant BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.organization_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view and update their own profile
CREATE POLICY "Users can view their own profile"
  ON public.organization_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.organization_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.organization_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_profiles (
    user_id,
    company_name,
    username,
    email,
    country_code,
    mobile_number,
    full_phone,
    is_merchant
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'country_code', '+61'),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_merchant')::boolean, false)
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Add updated_at trigger
CREATE TRIGGER update_organization_profiles_updated_at
  BEFORE UPDATE ON public.organization_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();