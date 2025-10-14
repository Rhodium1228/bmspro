-- Create quotation_settings table to store user quotation customizations
CREATE TABLE public.quotation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template TEXT NOT NULL DEFAULT 'modern',
  font TEXT NOT NULL DEFAULT 'inter',
  header_text TEXT,
  footer_text TEXT,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#1D8FCC',
  secondary_color TEXT NOT NULL DEFAULT '#0B1E3D',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quotation_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for quotation_settings
CREATE POLICY "Users can view their own quotation settings" 
ON public.quotation_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotation settings" 
ON public.quotation_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotation settings" 
ON public.quotation_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotation settings" 
ON public.quotation_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quotation_settings_updated_at
BEFORE UPDATE ON public.quotation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for quotation logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quotation-logos', 'quotation-logos', true);

-- Create policies for quotation logo storage
CREATE POLICY "Users can view quotation logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'quotation-logos');

CREATE POLICY "Users can upload their own quotation logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'quotation-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own quotation logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'quotation-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own quotation logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'quotation-logos' AND auth.uid()::text = (storage.foldername(name))[1]);