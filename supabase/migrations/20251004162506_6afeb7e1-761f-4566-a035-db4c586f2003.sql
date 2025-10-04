-- Create sale_orders table
CREATE TABLE public.sale_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for sale_orders
ALTER TABLE public.sale_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for sale_orders
CREATE POLICY "Users can view their own sale orders"
ON public.sale_orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sale orders"
ON public.sale_orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sale orders"
ON public.sale_orders
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sale orders"
ON public.sale_orders
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for sale_orders updated_at
CREATE TRIGGER update_sale_orders_updated_at
BEFORE UPDATE ON public.sale_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for purchase_orders
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase_orders
CREATE POLICY "Users can view their own purchase orders"
ON public.purchase_orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase orders"
ON public.purchase_orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase orders"
ON public.purchase_orders
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase orders"
ON public.purchase_orders
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for purchase_orders updated_at
CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();