-- Persist the pricing model (hourly/fixed) on each service line item so that
-- invoice edits are lossless even when the referenced service is later changed
-- or deleted. Parts leave this column null.
ALTER TABLE public.invoice_line_items
ADD COLUMN IF NOT EXISTS pricing_type text;
