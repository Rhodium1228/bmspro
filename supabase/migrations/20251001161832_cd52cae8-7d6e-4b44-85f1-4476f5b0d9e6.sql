-- Add status field to quotations table for tracking sent/unsent status
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'unsent' CHECK (status IN ('sent', 'unsent'));

-- Add is_completed field to quotations table for tracking pending/done status
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS is_completed boolean NOT NULL DEFAULT false;