-- Store part numbers separately from line descriptions on invoice part rows.
ALTER TABLE public.invoice_line_items
  ADD COLUMN IF NOT EXISTS snapshot_part_number text;
