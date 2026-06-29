ALTER TABLE public.shop_settings
ADD COLUMN IF NOT EXISTS invoice_list_default_statuses text[] DEFAULT ARRAY[
    'draft',
    'estimate',
    'in_progress',
    'completed'
]::text[];

UPDATE public.shop_settings
SET invoice_list_default_statuses = ARRAY[
    'draft',
    'estimate',
    'in_progress',
    'completed'
]::text[]
WHERE id = 1
  AND (
    invoice_list_default_statuses IS NULL
    OR cardinality(invoice_list_default_statuses) = 0
  );
