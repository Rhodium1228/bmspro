-- Add site_address column to job_work_schedules table
ALTER TABLE public.job_work_schedules 
ADD COLUMN site_address TEXT;