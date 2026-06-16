ALTER TABLE public.shop_settings
ADD COLUMN IF NOT EXISTS shop_name text,
ADD COLUMN IF NOT EXISTS shop_address text,
ADD COLUMN IF NOT EXISTS shop_phone text,
ADD COLUMN IF NOT EXISTS shop_email text,
ADD COLUMN IF NOT EXISTS tax_rate numeric(6, 3) DEFAULT 0;

UPDATE public.shop_settings
SET
    shop_name = COALESCE(shop_name, 'Moto Shop'),
    tax_rate = COALESCE(tax_rate, 0)
WHERE id = 1;
