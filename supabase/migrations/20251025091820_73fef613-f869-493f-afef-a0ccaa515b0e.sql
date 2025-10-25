-- Add coverage settings to security_layouts table
ALTER TABLE security_layouts 
ADD COLUMN IF NOT EXISTS coverage_settings JSONB DEFAULT '{"showCoverage": true, "showHeatmap": false, "showBlindSpots": false}'::jsonb;