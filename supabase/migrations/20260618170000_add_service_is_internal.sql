-- Invoice-only shop labor: never exposed on the public services API.
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.services.is_internal IS
  'When true, service is for invoices/admin only and never appears on the public menu API.';
