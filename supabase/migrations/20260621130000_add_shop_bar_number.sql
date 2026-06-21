-- Bureau of Automotive Repair (BAR) registration number for shop invoices.
ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS bar_number text;
