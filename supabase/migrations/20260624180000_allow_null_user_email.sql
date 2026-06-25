-- Phone-only riders: auth.users may have no email; profile row must allow NULL.
ALTER TABLE public.users
  ALTER COLUMN email DROP NOT NULL;
