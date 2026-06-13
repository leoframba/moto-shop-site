-- RLS policy verification queries for moto-shop-site
-- Run in Supabase SQL editor or via psql against a test database.
--
-- Prerequisites:
--   - Migration admin_only_writes applied
--   - public.is_admin() exists
--   - Test users with and without app_metadata.role = 'admin'

-- 1) Confirm policies exist
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('bike_listings', 'bike_images')
ORDER BY tablename, cmd;

-- 2) Confirm broad authenticated write policies were removed
SELECT policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname ILIKE '%authenticated users full access%';
-- Expected: 0 rows

-- 3) Simulate anonymous read (available listings)
SET LOCAL role TO anon;
SET LOCAL request.jwt.claims TO '{}';
-- SELECT should succeed for available/sold; fails for draft without admin claim

-- 4) Simulate customer JWT (authenticated, non-admin)
-- SET LOCAL request.jwt.claims TO '{"role":"authenticated","app_metadata":{"role":"customer"}}';
-- INSERT into bike_listings should fail

-- 5) Simulate admin JWT
-- SET LOCAL request.jwt.claims TO '{"role":"authenticated","app_metadata":{"role":"admin"}}';
-- INSERT/DELETE on draft bike_listings should succeed
