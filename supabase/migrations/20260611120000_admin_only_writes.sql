-- Admin-only write policies for moto-shop-site
-- Replaces broad "authenticated = full access" with JWT app_metadata.role = 'admin'

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- bike_listings: remove authenticated full access
DROP POLICY IF EXISTS "Allow authenticated users full access to listings" ON public.bike_listings;

CREATE POLICY "Admin can read all listings"
  ON public.bike_listings
  FOR SELECT
  TO public
  USING (public.is_admin());

CREATE POLICY "Admin can insert listings"
  ON public.bike_listings
  FOR INSERT
  TO public
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update listings"
  ON public.bike_listings
  FOR UPDATE
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete listings"
  ON public.bike_listings
  FOR DELETE
  TO public
  USING (public.is_admin());

-- bike_images: remove authenticated full access
DROP POLICY IF EXISTS "Allow authenticated users full access to images" ON public.bike_images;

CREATE POLICY "Admin can insert images"
  ON public.bike_images
  FOR INSERT
  TO public
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update images"
  ON public.bike_images
  FOR UPDATE
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete images"
  ON public.bike_images
  FOR DELETE
  TO public
  USING (public.is_admin());

-- storage: restrict sales_images mutations to admin
DROP POLICY IF EXISTS "Allow authenticated users to upload sales_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete sales_images" ON storage.objects;

CREATE POLICY "Admin can upload sales_images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'sales_images' AND public.is_admin());

CREATE POLICY "Admin can delete sales_images"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'sales_images' AND public.is_admin());
