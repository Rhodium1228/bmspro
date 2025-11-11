-- Create camera_models table
CREATE TABLE IF NOT EXISTS camera_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  category TEXT NOT NULL,
  resolution_mp NUMERIC NOT NULL,
  resolution_width INTEGER NOT NULL,
  resolution_height INTEGER NOT NULL,
  sensor_size TEXT DEFAULT '1/3"',
  lens_mm NUMERIC NOT NULL,
  fov_horizontal INTEGER,
  fov_vertical INTEGER,
  max_range_m INTEGER DEFAULT 30,
  ir_distance_m INTEGER,
  low_light_capability BOOLEAN DEFAULT false,
  max_fps INTEGER DEFAULT 30,
  video_compression TEXT[] DEFAULT ARRAY['H.264', 'H.265'],
  bitrate_kbps_default INTEGER DEFAULT 4096,
  bitrate_kbps_min INTEGER DEFAULT 1024,
  bitrate_kbps_max INTEGER DEFAULT 8192,
  poe_standard TEXT DEFAULT 'PoE',
  power_watts NUMERIC DEFAULT 12,
  network_interface TEXT DEFAULT '10/100 Ethernet',
  ip_rating TEXT DEFAULT 'IP66',
  operating_temp_range TEXT DEFAULT '-30°C to 60°C',
  mounting_type TEXT DEFAULT 'wall',
  retail_price_aud NUMERIC,
  wholesale_price_aud NUMERIC,
  datasheet_url TEXT,
  image_url TEXT,
  manufacturer_url TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand, model, lens_mm)
);

ALTER TABLE camera_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all camera models" ON camera_models;
CREATE POLICY "Users can view all camera models"
  ON camera_models FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own camera models" ON camera_models;
CREATE POLICY "Users can create their own camera models"
  ON camera_models FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own camera models" ON camera_models;
CREATE POLICY "Users can update their own camera models"
  ON camera_models FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own camera models" ON camera_models;
CREATE POLICY "Users can delete their own camera models"
  ON camera_models FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_camera_models_updated_at ON camera_models;
CREATE TRIGGER update_camera_models_updated_at
  BEFORE UPDATE ON camera_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE security_layouts
  ADD COLUMN IF NOT EXISTS bandwidth_analysis JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS storage_requirements JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS compliance_report JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dori_mode_enabled BOOLEAN DEFAULT false;