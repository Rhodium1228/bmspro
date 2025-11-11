-- Fix camera_models RLS policies to prevent modification of default models

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can create their own camera models" ON public.camera_models;
DROP POLICY IF EXISTS "Users can update their own camera models" ON public.camera_models;
DROP POLICY IF EXISTS "Users can delete their own camera models" ON public.camera_models;

-- Create strict policies that only allow users to manage their own models
CREATE POLICY "Users can create their own camera models"
ON public.camera_models
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own camera models"
ON public.camera_models
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own camera models"
ON public.camera_models
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Note: Default camera models (user_id IS NULL) can only be managed through migrations
-- This prevents users from corrupting the shared camera database