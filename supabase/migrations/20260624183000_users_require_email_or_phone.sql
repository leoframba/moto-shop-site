-- Riders must have at least one login identifier on file.
ALTER TABLE public.users
  ADD CONSTRAINT users_require_email_or_phone
  CHECK (email IS NOT NULL OR phone_number IS NOT NULL);
