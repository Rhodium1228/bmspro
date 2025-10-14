-- Add datasheet_url column to items table
ALTER TABLE public.items 
ADD COLUMN datasheet_url text;

-- Create storage bucket for datasheets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('datasheets', 'datasheets', true);

-- Create RLS policies for datasheet uploads
CREATE POLICY "Users can view datasheets"
ON storage.objects FOR SELECT
USING (bucket_id = 'datasheets');

CREATE POLICY "Users can upload their own datasheets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'datasheets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own datasheets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'datasheets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own datasheets"
ON storage.objects FOR DELETE
USING (bucket_id = 'datasheets' AND auth.uid()::text = (storage.foldername(name))[1]);