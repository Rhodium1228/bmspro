-- Add PO-related fields to sale_orders table
ALTER TABLE public.sale_orders
ADD COLUMN quotation_id UUID REFERENCES public.quotations(id),
ADD COLUMN po_number TEXT,
ADD COLUMN po_date DATE,
ADD COLUMN po_approved_note TEXT;

-- Add PO-related fields to purchase_orders table
ALTER TABLE public.purchase_orders
ADD COLUMN quotation_id UUID REFERENCES public.quotations(id),
ADD COLUMN po_number TEXT,
ADD COLUMN po_date DATE,
ADD COLUMN po_approved_note TEXT;

-- Create index for faster lookups
CREATE INDEX idx_sale_orders_quotation_id ON public.sale_orders(quotation_id);
CREATE INDEX idx_purchase_orders_quotation_id ON public.purchase_orders(quotation_id);
CREATE INDEX idx_sale_orders_user_id ON public.sale_orders(user_id);
CREATE INDEX idx_purchase_orders_user_id ON public.purchase_orders(user_id);