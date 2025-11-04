-- Create job_cards table
CREATE TABLE public.job_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_order_id UUID REFERENCES public.sale_orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_card_items table
CREATE TABLE public.job_card_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT,
  availability_date DATE NOT NULL,
  assigned_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_employee_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_card_items ENABLE ROW LEVEL SECURITY;

-- Create policies for job_cards
CREATE POLICY "Users can view their own job cards"
  ON public.job_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job cards"
  ON public.job_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job cards"
  ON public.job_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job cards"
  ON public.job_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for job_card_items
CREATE POLICY "Users can view their job card items"
  ON public.job_card_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_cards
      WHERE job_cards.id = job_card_items.job_card_id
      AND job_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their job card items"
  ON public.job_card_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_cards
      WHERE job_cards.id = job_card_items.job_card_id
      AND job_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their job card items"
  ON public.job_card_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.job_cards
      WHERE job_cards.id = job_card_items.job_card_id
      AND job_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their job card items"
  ON public.job_card_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.job_cards
      WHERE job_cards.id = job_card_items.job_card_id
      AND job_cards.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at on job_cards
CREATE TRIGGER update_job_cards_updated_at
  BEFORE UPDATE ON public.job_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on job_card_items
CREATE TRIGGER update_job_card_items_updated_at
  BEFORE UPDATE ON public.job_card_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_job_cards_user_id ON public.job_cards(user_id);
CREATE INDEX idx_job_cards_sale_order_id ON public.job_cards(sale_order_id);
CREATE INDEX idx_job_card_items_job_card_id ON public.job_card_items(job_card_id);
CREATE INDEX idx_job_card_items_employee_id ON public.job_card_items(assigned_employee_id);