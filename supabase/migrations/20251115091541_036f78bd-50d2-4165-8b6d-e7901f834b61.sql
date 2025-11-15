-- Drop trigger first, then function
DROP TRIGGER IF EXISTS update_staff_locations_updated_at ON public.staff_locations;
DROP FUNCTION IF EXISTS public.update_staff_locations_updated_at();

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION public.update_staff_locations_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_staff_locations_updated_at
BEFORE UPDATE ON public.staff_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_staff_locations_updated_at();