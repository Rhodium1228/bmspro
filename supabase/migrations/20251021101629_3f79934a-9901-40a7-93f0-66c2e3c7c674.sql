-- Create security design projects table
CREATE TABLE public.security_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  floor_plan_url TEXT,
  floor_plan_type TEXT,
  template_name TEXT,
  canvas_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_projects
CREATE POLICY "Users can view their own security projects" 
ON public.security_projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own security projects" 
ON public.security_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security projects" 
ON public.security_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own security projects" 
ON public.security_projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create device library table
CREATE TABLE public.security_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type TEXT NOT NULL,
  name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  icon_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_devices ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view devices
CREATE POLICY "All users can view security devices" 
ON public.security_devices 
FOR SELECT 
TO authenticated
USING (true);

-- Create floor plan templates table
CREATE TABLE public.floor_plan_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  image_url TEXT NOT NULL,
  dimensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.floor_plan_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view templates
CREATE POLICY "All users can view floor plan templates" 
ON public.floor_plan_templates 
FOR SELECT 
TO authenticated
USING (true);

-- Add trigger for security_projects updated_at
CREATE TRIGGER update_security_projects_updated_at
BEFORE UPDATE ON public.security_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default device types
INSERT INTO public.security_devices (device_type, name, properties, icon_data) VALUES
('camera', 'CCTV Camera', '{"coverage_angle": 90, "range": 15, "color": "#3b82f6"}'::jsonb, 'video'),
('fan', 'Fan', '{"diameter": 1.2, "color": "#10b981"}'::jsonb, 'fan'),
('pir_sensor', 'PIR Motion Sensor', '{"detection_angle": 120, "range": 10, "color": "#f59e0b"}'::jsonb, 'rss');

-- Insert default templates
INSERT INTO public.floor_plan_templates (name, category, image_url, dimensions) VALUES
('Single Family Home', 'residential', '/templates/single-family-home.png', '{"width": 800, "height": 600}'::jsonb),
('Office Space', 'office', '/templates/office-space.png', '{"width": 1000, "height": 700}'::jsonb),
('Retail Store', 'retail', '/templates/retail-store.png', '{"width": 900, "height": 650}'::jsonb),
('Warehouse', 'industrial', '/templates/warehouse.png', '{"width": 1200, "height": 800}'::jsonb),
('Apartment Building', 'residential', '/templates/apartment-building.png', '{"width": 850, "height": 700}'::jsonb);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('floor-plans', 'floor-plans', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('templates', 'templates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for floor-plans bucket
CREATE POLICY "Users can view floor plans" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'floor-plans');

CREATE POLICY "Authenticated users can upload floor plans" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'floor-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own floor plans" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'floor-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own floor plans" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'floor-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for templates bucket
CREATE POLICY "Everyone can view templates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'templates');