-- Create security_layouts table
CREATE TABLE public.security_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  floor_plan_url TEXT,
  floor_plan_type TEXT,
  template_name TEXT,
  canvas_data JSONB DEFAULT '{}'::jsonb,
  export_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_layouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_layouts
CREATE POLICY "Users can view their own security layouts"
ON public.security_layouts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own security layouts"
ON public.security_layouts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security layouts"
ON public.security_layouts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own security layouts"
ON public.security_layouts
FOR DELETE
USING (auth.uid() = user_id);

-- Add security_layout_id to quotations table
ALTER TABLE public.quotations
ADD COLUMN security_layout_id UUID REFERENCES public.security_layouts(id) ON DELETE SET NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_security_layouts_updated_at
BEFORE UPDATE ON public.security_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for layout exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('layout-exports', 'layout-exports', true)
ON CONFLICT (id) DO NOTHING;