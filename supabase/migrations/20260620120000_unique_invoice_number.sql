-- Enforce unique customer-facing invoice numbers at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS invoices_invoice_number_unique_idx
  ON public.invoices (invoice_number);
