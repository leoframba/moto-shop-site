-- MVP labor tracking: employees, pay period settings, mechanic assignment on service lines.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pay_period_length') THEN
    CREATE TYPE public.pay_period_length AS ENUM ('weekly', 'bi-weekly', 'monthly');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS pay_period_length public.pay_period_length NOT NULL DEFAULT 'bi-weekly',
  ADD COLUMN IF NOT EXISTS anchor_date date NOT NULL DEFAULT '2026-06-17',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Los_Angeles';

ALTER TABLE public.invoice_line_items
  ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.employees TO service_role;
