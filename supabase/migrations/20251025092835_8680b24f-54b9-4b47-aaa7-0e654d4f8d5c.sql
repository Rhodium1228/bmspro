-- Add layer management, annotations, and security zones to security_layouts table
ALTER TABLE security_layouts 
ADD COLUMN IF NOT EXISTS layer_settings JSONB DEFAULT '{
  "background": {"visible": true, "locked": false, "opacity": 100},
  "cameras": {"visible": true, "locked": false, "opacity": 100},
  "pirs": {"visible": true, "locked": false, "opacity": 100},
  "fans": {"visible": true, "locked": false, "opacity": 100},
  "annotations": {"visible": true, "locked": false, "opacity": 100},
  "coverage": {"visible": true, "locked": false, "opacity": 100}
}'::jsonb;

ALTER TABLE security_layouts 
ADD COLUMN IF NOT EXISTS annotations JSONB DEFAULT '[]'::jsonb;

ALTER TABLE security_layouts 
ADD COLUMN IF NOT EXISTS security_zones JSONB DEFAULT '[]'::jsonb;