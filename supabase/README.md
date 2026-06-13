# Supabase migrations

Migrations in `migrations/` are applied to the **moto-shop-site** project.

## Tests

- **SQL checks:** `tests/rls_bike_policies.sql`
- **Live RLS integration:** `yarn test:integration` from repo root (see `apps/frontend/.env.test.example`)

## Admin role (required)

Bike writes and `/api/admin/*` require `app_metadata.role = "admin"` on the user JWT.

In **Supabase Dashboard → Authentication → Users → select user → App Metadata**:

```json
{ "role": "admin" }
```

Staff without this role can sign in as customers but cannot mutate inventory or manage services via the API.

## Latest: `admin_only_writes`

- Adds `public.is_admin()` helper (`app_metadata.role = 'admin'`)
- Removes broad `authenticated` write access on `bike_listings`, `bike_images`, `sales_images`
- Customers (authenticated, non-admin): read-only inventory
- Admins: full CRUD on bikes/images/storage
