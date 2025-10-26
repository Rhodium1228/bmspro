-- Add more default solar panel specifications with cell configurations
INSERT INTO public.solar_panel_specs (name, manufacturer, model, wattage, efficiency, dimensions_mm, voltage, current, is_default)
VALUES
  ('60 Cell Monocrystalline', 'Generic', '60-MONO-450', 450, 21.5, '{"width": 1000, "height": 1650, "depth": 30, "cells": {"rows": 10, "cols": 6, "type": "mono"}}'::jsonb, 48.0, 9.38, true),
  ('72 Cell Monocrystalline', 'Generic', '72-MONO-540', 540, 22.0, '{"width": 1000, "height": 1996, "depth": 30, "cells": {"rows": 12, "cols": 6, "type": "mono"}}'::jsonb, 48.5, 11.13, true),
  ('120 HF Polycrystalline', 'Generic', '120HF-POLY-480', 480, 19.8, '{"width": 1000, "height": 1650, "depth": 35, "cells": {"rows": 20, "cols": 6, "type": "poly-hf"}}'::jsonb, 49.2, 9.76, true),
  ('144 HF High Efficiency', 'Generic', '144HF-MONO-600', 600, 22.8, '{"width": 1134, "height": 2278, "depth": 30, "cells": {"rows": 24, "cols": 6, "type": "mono-hf"}}'::jsonb, 54.7, 10.97, true)
ON CONFLICT DO NOTHING;