-- Create task templates table
CREATE TABLE job_work_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_default BOOLEAN DEFAULT false,
  template_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add comments
COMMENT ON TABLE job_work_task_templates IS 'Stores reusable task templates with predefined sub-tasks';
COMMENT ON COLUMN job_work_task_templates.template_data IS 'JSONB array containing parent task and sub-tasks with all their properties';
COMMENT ON COLUMN job_work_task_templates.is_default IS 'System-provided default templates';
COMMENT ON COLUMN job_work_task_templates.category IS 'Template category for grouping (e.g., Installation, Configuration, Testing)';

-- Create index
CREATE INDEX idx_task_templates_user ON job_work_task_templates(user_id);
CREATE INDEX idx_task_templates_category ON job_work_task_templates(category) WHERE category IS NOT NULL;

-- Enable RLS
ALTER TABLE job_work_task_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own templates and defaults"
  ON job_work_task_templates
  FOR SELECT
  USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can create their own templates"
  ON job_work_task_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own templates"
  ON job_work_task_templates
  FOR UPDATE
  USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own templates"
  ON job_work_task_templates
  FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

-- Add trigger for updated_at
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON job_work_task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates
INSERT INTO job_work_task_templates (user_id, name, description, category, is_default, template_data)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'CCTV Installation',
  'Complete CCTV camera installation workflow with all standard tasks',
  'Security',
  true,
  '[
    {
      "item_name": "CCTV Installation Project",
      "quantity": 1,
      "unit": "project",
      "priority": "high",
      "estimated_hours": 40,
      "skills_required": ["CCTV", "Electrical", "Network Setup"],
      "is_parent": true,
      "sub_tasks": [
        {
          "item_name": "Site Survey & Planning",
          "quantity": 1,
          "unit": "task",
          "priority": "critical",
          "estimated_hours": 4,
          "skills_required": ["CCTV", "Site Assessment"],
          "notes": "Survey site, identify camera locations, check power availability"
        },
        {
          "item_name": "Cable Routing & Installation",
          "quantity": 1,
          "unit": "task",
          "priority": "high",
          "estimated_hours": 12,
          "skills_required": ["Electrical", "Cable Management"],
          "notes": "Install cable trays, route cables, ensure proper cable management"
        },
        {
          "item_name": "Camera Mounting",
          "quantity": 1,
          "unit": "task",
          "priority": "high",
          "estimated_hours": 8,
          "skills_required": ["Installation", "CCTV"],
          "notes": "Mount cameras at designated locations, ensure proper angles"
        },
        {
          "item_name": "Network Configuration",
          "quantity": 1,
          "unit": "task",
          "priority": "high",
          "estimated_hours": 6,
          "skills_required": ["Network Setup", "Configuration"],
          "notes": "Configure IP addresses, connect to NVR, test connectivity"
        },
        {
          "item_name": "System Testing & Calibration",
          "quantity": 1,
          "unit": "task",
          "priority": "medium",
          "estimated_hours": 6,
          "skills_required": ["CCTV", "Testing"],
          "notes": "Test all cameras, adjust angles, configure motion detection"
        },
        {
          "item_name": "Client Training & Documentation",
          "quantity": 1,
          "unit": "task",
          "priority": "medium",
          "estimated_hours": 4,
          "skills_required": ["Documentation", "Training"],
          "notes": "Train client on system operation, provide documentation"
        }
      ]
    }
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM job_work_task_templates WHERE name = 'CCTV Installation');

INSERT INTO job_work_task_templates (user_id, name, description, category, is_default, template_data)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Network Infrastructure Setup',
  'Complete network setup including cabling, switches, and configuration',
  'Network',
  true,
  '[
    {
      "item_name": "Network Infrastructure Project",
      "quantity": 1,
      "unit": "project",
      "priority": "high",
      "estimated_hours": 32,
      "skills_required": ["Network Setup", "IT Infrastructure"],
      "is_parent": true,
      "sub_tasks": [
        {
          "item_name": "Network Design & Planning",
          "quantity": 1,
          "unit": "task",
          "priority": "critical",
          "estimated_hours": 6,
          "skills_required": ["Network Design", "Planning"],
          "notes": "Design network topology, plan IP schema, select equipment"
        },
        {
          "item_name": "Cable Installation",
          "quantity": 1,
          "unit": "task",
          "priority": "high",
          "estimated_hours": 8,
          "skills_required": ["Network Cabling", "Installation"],
          "notes": "Install Cat6 cabling, patch panels, cable management"
        },
        {
          "item_name": "Switch & Router Installation",
          "quantity": 1,
          "unit": "task",
          "priority": "high",
          "estimated_hours": 4,
          "skills_required": ["Network Setup", "Hardware Installation"],
          "notes": "Mount and connect network switches and routers"
        },
        {
          "item_name": "Network Configuration",
          "quantity": 1,
          "unit": "task",
          "priority": "high",
          "estimated_hours": 8,
          "skills_required": ["Network Setup", "Configuration"],
          "notes": "Configure VLANs, routing, security policies"
        },
        {
          "item_name": "Testing & Optimization",
          "quantity": 1,
          "unit": "task",
          "priority": "medium",
          "estimated_hours": 4,
          "skills_required": ["Network Testing", "Troubleshooting"],
          "notes": "Test connectivity, optimize performance, document configuration"
        },
        {
          "item_name": "Documentation & Handover",
          "quantity": 1,
          "unit": "task",
          "priority": "low",
          "estimated_hours": 2,
          "skills_required": ["Documentation"],
          "notes": "Create network diagrams, document IP addresses and credentials"
        }
      ]
    }
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM job_work_task_templates WHERE name = 'Network Infrastructure Setup');

INSERT INTO job_work_task_templates (user_id, name, description, category, is_default, template_data)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Solar Panel Installation',
  'Complete solar panel installation from site survey to commissioning',
  'Solar',
  true,
  '[
    {
      "item_name": "Solar Installation Project",
      "quantity": 1,
      "unit": "project",
      "priority": "high",
      "estimated_hours": 48,
      "skills_required": ["Solar Installation", "Electrical"],
      "is_parent": true,
      "sub_tasks": [
        {
          "item_name": "Site Assessment",
          "quantity": 1,
          "unit": "task",
          "priority": "critical",
          "estimated_hours": 4,
          "skills_required": ["Site Assessment", "Solar Design"],
          "notes": "Assess roof condition, measure area, check sun exposure"
        },
        {
          "item_name": "Mounting Structure Installation",
          "quantity": 1,
          "unit": "task",
          "priority": "high",
          "estimated_hours": 12,
          "skills_required": ["Installation", "Structural Work"],
          "notes": "Install mounting rails and brackets on roof"
        },
        {
          "item_name": "Solar Panel Installation",
          "quantity": 1,
          "unit": "task",
          "priority": "high",
          "estimated_hours": 16,
          "skills_required": ["Solar Installation"],
          "notes": "Mount solar panels, connect in series/parallel"
        },
        {
          "item_name": "Electrical Wiring",
          "quantity": 1,
          "unit": "task",
          "priority": "high",
          "estimated_hours": 8,
          "skills_required": ["Electrical", "Solar Installation"],
          "notes": "Install inverter, connect DC wiring, run AC wiring"
        },
        {
          "item_name": "System Testing & Commissioning",
          "quantity": 1,
          "unit": "task",
          "priority": "medium",
          "estimated_hours": 6,
          "skills_required": ["Testing", "Solar Installation"],
          "notes": "Test system output, configure monitoring, verify safety"
        },
        {
          "item_name": "Documentation & Training",
          "quantity": 1,
          "unit": "task",
          "priority": "low",
          "estimated_hours": 2,
          "skills_required": ["Documentation"],
          "notes": "Provide system documentation and client training"
        }
      ]
    }
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM job_work_task_templates WHERE name = 'Solar Panel Installation');