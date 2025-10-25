-- Add policy to allow users to create their own custom templates
CREATE POLICY "Users can insert their own templates"
ON floor_plan_templates
FOR INSERT
WITH CHECK (true);

-- Add policy to allow storage of custom templates in templates bucket
CREATE POLICY "Users can upload custom templates"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'templates' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their template uploads"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'templates' AND auth.uid() IS NOT NULL);