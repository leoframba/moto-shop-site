-- Hazardous waste disposal rate (per quart) and line item type for itemized invoices.
ALTER TABLE public.shop_settings
ADD COLUMN IF NOT EXISTS hazardous_waste_rate numeric(10, 2) DEFAULT 0;

UPDATE public.shop_settings
SET hazardous_waste_rate = COALESCE(hazardous_waste_rate, 0)
WHERE id = 1;

ALTER TABLE public.invoice_line_items
DROP CONSTRAINT IF EXISTS invoice_line_items_item_type_check;

ALTER TABLE public.invoice_line_items
ADD CONSTRAINT invoice_line_items_item_type_check
CHECK (
  item_type = ANY (
    ARRAY['service'::text, 'part'::text, 'custom'::text, 'hazardous_waste'::text]
  )
);
