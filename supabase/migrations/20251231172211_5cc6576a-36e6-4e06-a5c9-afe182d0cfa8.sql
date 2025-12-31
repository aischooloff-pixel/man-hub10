-- Create table for pending product rejections
CREATE TABLE public.pending_product_rejections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.user_products(id) ON DELETE CASCADE,
  admin_telegram_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_product_rejections ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "Service role only"
ON public.pending_product_rejections
FOR ALL
USING (false)
WITH CHECK (true);

-- Auto-cleanup old entries (older than 24 hours)
CREATE INDEX idx_pending_product_rejections_admin ON public.pending_product_rejections(admin_telegram_id);