-- Solar project table
CREATE TABLE IF NOT EXISTS public.solar_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  roof_plan_url TEXT,
  roof_plan_type TEXT,
  template_name TEXT,
  canvas_data JSONB DEFAULT '{}'::jsonb,
  layer_settings JSONB DEFAULT '{
    "background": {"visible": true, "locked": false, "opacity": 100},
    "panels": {"visible": true, "locked": false, "opacity": 100},
    "arrays": {"visible": true, "locked": false, "opacity": 100},
    "obstacles": {"visible": true, "locked": false, "opacity": 100},
    "annotations": {"visible": true, "locked": false, "opacity": 100},
    "shading": {"visible": true, "locked": false, "opacity": 100}
  }'::jsonb,
  export_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roof templates table
CREATE TABLE IF NOT EXISTS public.roof_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  roof_type TEXT,
  image_url TEXT NOT NULL,
  dimensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solar panel specifications
CREATE TABLE IF NOT EXISTS public.solar_panel_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  item_id UUID REFERENCES public.items(id),
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  wattage INTEGER NOT NULL,
  efficiency NUMERIC(5,2),
  dimensions_mm JSONB,
  voltage NUMERIC(5,2),
  current NUMERIC(5,2),
  datasheet_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solar calculations
CREATE TABLE IF NOT EXISTS public.solar_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.solar_projects(id) ON DELETE CASCADE,
  location_data JSONB,
  system_data JSONB,
  financial_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.solar_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roof_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_panel_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for solar_projects
CREATE POLICY "Users can view their own solar projects"
  ON public.solar_projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own solar projects"
  ON public.solar_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own solar projects"
  ON public.solar_projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own solar projects"
  ON public.solar_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for roof_templates (public read)
CREATE POLICY "Roof templates are viewable by everyone"
  ON public.roof_templates
  FOR SELECT
  USING (true);

-- RLS Policies for solar_panel_specs
CREATE POLICY "Users can view all panel specs"
  ON public.solar_panel_specs
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own panel specs"
  ON public.solar_panel_specs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own panel specs"
  ON public.solar_panel_specs
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for solar_calculations
CREATE POLICY "Users can view their solar calculations"
  ON public.solar_calculations
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.solar_projects
    WHERE solar_projects.id = solar_calculations.project_id
    AND solar_projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create solar calculations"
  ON public.solar_calculations
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.solar_projects
    WHERE solar_projects.id = solar_calculations.project_id
    AND solar_projects.user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_solar_projects_updated_at
  BEFORE UPDATE ON public.solar_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('roof-plans', 'roof-plans', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('solar-exports', 'solar-exports', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('solar-templates', 'solar-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for roof-plans
CREATE POLICY "Users can upload their own roof plans"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'roof-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Roof plans are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'roof-plans');

CREATE POLICY "Users can delete their own roof plans"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'roof-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for solar-exports
CREATE POLICY "Users can upload their own solar exports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'solar-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Solar exports are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'solar-exports');

CREATE POLICY "Users can delete their own solar exports"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'solar-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for solar-templates
CREATE POLICY "Solar templates are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'solar-templates');

-- Insert default panel specifications
INSERT INTO public.solar_panel_specs (name, manufacturer, model, wattage, efficiency, dimensions_mm, voltage, current, is_default)
VALUES 
  ('450W Monocrystalline', 'Generic', 'MONO-450', 450, 21.5, '{"width": 1134, "height": 1722, "depth": 30}'::jsonb, 48.5, 9.28, true),
  ('400W Polycrystalline', 'Generic', 'POLY-400', 400, 19.8, '{"width": 1134, "height": 1722, "depth": 35}'::jsonb, 46.2, 8.66, true),
  ('500W High Efficiency', 'Generic', 'MONO-500', 500, 22.8, '{"width": 1134, "height": 1722, "depth": 30}'::jsonb, 49.8, 10.04, true)
ON CONFLICT DO NOTHING;