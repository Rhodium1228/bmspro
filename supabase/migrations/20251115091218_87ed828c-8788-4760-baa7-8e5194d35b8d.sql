-- Create enum for location accuracy levels
CREATE TYPE public.location_accuracy AS ENUM ('high', 'medium', 'low');

-- Create staff_locations table for GPS tracking
CREATE TABLE public.staff_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  accuracy_level public.location_accuracy DEFAULT 'medium',
  current_job_id UUID,
  is_active BOOLEAN DEFAULT true,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_staff_locations_employee_id ON public.staff_locations(employee_id);
CREATE INDEX idx_staff_locations_timestamp ON public.staff_locations(timestamp DESC);
CREATE INDEX idx_staff_locations_active ON public.staff_locations(is_active, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.staff_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view locations of staff in their organization
CREATE POLICY "Users can view staff locations in their organization"
ON public.staff_locations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = staff_locations.employee_id
    AND employees.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.employees e1
    INNER JOIN public.employees e2 ON e1.user_id = e2.user_id
    WHERE e1.id = staff_locations.employee_id
    AND e2.user_id = auth.uid()
  )
);

-- Policy: Staff can insert/update their own location
CREATE POLICY "Staff can update their own location"
ON public.staff_locations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = staff_locations.employee_id
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can update their own location records"
ON public.staff_locations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = staff_locations.employee_id
    AND employees.user_id = auth.uid()
  )
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_staff_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_staff_locations_updated_at
BEFORE UPDATE ON public.staff_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_staff_locations_updated_at();

-- Enable realtime for live location updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_locations;

-- Create view for latest staff locations (one per employee)
CREATE OR REPLACE VIEW public.latest_staff_locations AS
SELECT DISTINCT ON (employee_id)
  sl.id,
  sl.employee_id,
  sl.latitude,
  sl.longitude,
  sl.accuracy,
  sl.battery_level,
  sl.accuracy_level,
  sl.current_job_id,
  sl.is_active,
  sl.timestamp,
  e.name,
  e.designation,
  e.phone,
  e.email,
  CASE 
    WHEN sl.timestamp > now() - interval '10 minutes' THEN 'online'
    ELSE 'offline'
  END as status
FROM public.staff_locations sl
INNER JOIN public.employees e ON e.id = sl.employee_id
WHERE sl.is_active = true
ORDER BY employee_id, timestamp DESC;