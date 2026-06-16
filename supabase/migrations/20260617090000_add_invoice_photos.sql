-- Invoice photos: a private storage bucket plus a metadata table. All access is
-- mediated by the backend service role, which hands out short-lived signed URLs,
-- so no public bucket policies are required.

insert into storage.buckets (id, name, public)
values ('invoice-photos', 'invoice-photos', false)
on conflict (id) do nothing;

create table if not exists public.invoice_photos (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid not null references public.invoices(id) on delete cascade,
    storage_path text not null,
    caption text,
    uploaded_by uuid references public.users(id) on delete set null,
    created_at timestamptz not null default now()
);

create index if not exists invoice_photos_invoice_id_idx
    on public.invoice_photos (invoice_id);

alter table public.invoice_photos enable row level security;

-- Service role bypasses RLS but still needs table privileges granted explicitly.
grant select, insert, update, delete on public.invoice_photos to service_role;
