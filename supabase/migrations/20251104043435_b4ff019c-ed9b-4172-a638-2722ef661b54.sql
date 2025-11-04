-- Create job_work_schedules table
CREATE TABLE IF NOT EXISTS public.job_work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create job_work_schedule_items table
CREATE TABLE IF NOT EXISTS public.job_work_schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_work_schedule_id UUID NOT NULL REFERENCES public.job_work_schedules(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT,
  availability_date DATE NOT NULL,
  assigned_employee_id UUID,
  assigned_employee_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_work_schedule_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_work_schedules
CREATE POLICY "Users can view their own job work schedules"
  ON public.job_work_schedules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job work schedules"
  ON public.job_work_schedules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job work schedules"
  ON public.job_work_schedules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job work schedules"
  ON public.job_work_schedules
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for job_work_schedule_items
CREATE POLICY "Users can view their job work schedule items"
  ON public.job_work_schedule_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_work_schedules
      WHERE job_work_schedules.id = job_work_schedule_items.job_work_schedule_id
      AND job_work_schedules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their job work schedule items"
  ON public.job_work_schedule_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_work_schedules
      WHERE job_work_schedules.id = job_work_schedule_items.job_work_schedule_id
      AND job_work_schedules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their job work schedule items"
  ON public.job_work_schedule_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM job_work_schedules
      WHERE job_work_schedules.id = job_work_schedule_items.job_work_schedule_id
      AND job_work_schedules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their job work schedule items"
  ON public.job_work_schedule_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM job_work_schedules
      WHERE job_work_schedules.id = job_work_schedule_items.job_work_schedule_id
      AND job_work_schedules.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_work_schedules_user_id ON public.job_work_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_job_work_schedules_purchase_order_id ON public.job_work_schedules(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_job_work_schedule_items_schedule_id ON public.job_work_schedule_items(job_work_schedule_id);

-- Create updated_at triggers
CREATE TRIGGER update_job_work_schedules_updated_at
  BEFORE UPDATE ON public.job_work_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_work_schedule_items_updated_at
  BEFORE UPDATE ON public.job_work_schedule_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();