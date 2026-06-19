-- Parts are referenced by UUID on invoices; part_number is optional.
-- Uniqueness is enforced on description (case-insensitive); part numbers stay
-- unique when provided.
ALTER TABLE public.parts
  ALTER COLUMN part_number DROP NOT NULL;

ALTER TABLE public.parts
  DROP CONSTRAINT IF EXISTS parts_part_number_key;

CREATE UNIQUE INDEX parts_description_unique
  ON public.parts (lower(trim(description)));

CREATE UNIQUE INDEX parts_part_number_unique
  ON public.parts (part_number)
  WHERE part_number IS NOT NULL;
