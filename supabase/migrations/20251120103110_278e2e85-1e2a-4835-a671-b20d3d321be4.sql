-- Add quotation_id to checklists table
ALTER TABLE checklists ADD COLUMN quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_checklists_quotation_id ON checklists(quotation_id);