# Advanced Cycle Service

Full-stack web platform for **Advanced Cycle Service** — a Bay Area motorcycle shop. The monorepo powers a public marketing site, consignment sales inventory, a rider portal, and a shop admin dashboard for invoicing, labor, and day-to-day operations.

**Live site:** [www.advcycles.com](https://www.advcycles.com)

---

## What’s included

| Surface | Who it’s for | Highlights |
|---------|--------------|------------|
| **Public website** | Visitors | Services menu, consignment bikes for sale, reviews, contact |
| **Rider portal** | Customers | Garage, invoice history, print & photos |
| **Admin dashboard** | Shop staff | Invoices, bikes, parts, labor, users, stats, settings |

---

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Public site        │     │  Rider portal        │     │  Admin dashboard    │
│  / /services /sales │     │  /account            │     │  /admin             │
└─────────┬───────────┘     └──────────┬───────────┘     └──────────┬──────────┘
          │                            │                            │
          │              Next.js frontend (apps/frontend)           │
          └────────────────────────────┼────────────────────────────┘
                                       │  /api/* rewrite
                                       ▼
                         FastAPI backend (apps/backend)
                                       │
                                       ▼
                    Supabase (Postgres · Auth · Storage · RLS)
```

### Monorepo layout

```
moto-shop-site/
├── apps/frontend/     # Next.js 16 · React 19 · Tailwind 4
├── apps/backend/      # FastAPI · Uvicorn · Supabase service role
├── supabase/          # SQL migrations & RLS helpers
└── package.json       # Yarn 4 workspaces
```

### Tech stack

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Biome, Vitest, Playwright  
- **Backend:** FastAPI, Pydantic, Supabase Python SDK, Google Gemini (voice notes)  
- **Data / auth:** Supabase (Postgres, Auth, Storage, RLS)  
- **Email:** Resend (contact form)  
- **Hosting:** Vercel (frontend + Analytics / Speed Insights); backend typically on Cloud Run  

---

## Public website

| Route | Description |
|-------|-------------|
| `/` | Hero landing page with shop branding and CTAs |
| `/services` | Public service menu — categories, hourly / fixed / call-for-quote pricing |
| `/sales` | Consignment inventory grid (available & sold listings) |
| `/sales/[id]` | Listing detail with image carousel |
| `/reviews` | Customer testimonials; links to Google & Yelp |
| `/contact` | Service inquiry form (supports `?service=` prefill) |
| `/about` | About page |

**Service menu notes**

- Only non-hidden, non-internal services appear publicly  
- Pricing types: **hourly** (hours × shop rate), **fixed**, or **contact** (“Call for Quote”)  
- Grouped by category in collapsible sections  

**Sales inventory**

- Separate from customer garage bikes (`bike_listings` vs `bikes`)  
- Statuses: `available`, `sold`, `draft` (drafts are admin-only)  

---

## Rider portal (`/account`)

Invite-only accounts. Customers sign in with email **or** phone + password.

### Garage

- View owned bikes (year, make, model, VIN, plate)  
- Browse invoices with status-aware detail:

| Invoice status | What the rider sees |
|----------------|---------------------|
| `in_progress` | Summary only (no line items) |
| `estimate` | Line items; no mechanic notes |
| `completed` / `paid` | Full detail, mechanic notes, photos, print |

- Print completed/paid invoices (browser print layout)  
- View invoice photos in a lightbox  

### Profile

- Account details and password change  
- Admins also get a link to `/admin`  

---

## Admin dashboard (`/admin`)

Admin-only (`app_metadata.role = "admin"`). Sidebar tabs:

### Invoices (default)

- **Invoice builder** — customer (linked user or walk-in snapshot), bike, status, odometer, invoice #, date  
- Line items: **services** (with mechanic assignment), **parts**, optional **hazardous waste**  
- Custom line names; hourly vs fixed service pricing  
- Tax & hazardous-waste rates from shop settings  
- List filters by status, owner, and bike  
- Inline status updates, delete, expand for details  
- **Mechanic notes** — typed or **voice notes** (Gemini transcription + summary)  
- **Invoice photos** — upload, caption, delete (private storage, signed URLs)  
- **Print** — letter layout with pinned totals, notes beside summary, multi-page overflow  

Walk-in customers can be snapshotted on the invoice without a portal account. Linking a bike to a user later does **not** rewrite past invoice snapshots.

### Services

- Categories and service CRUD  
- Public visibility (`is_hidden`) and internal-only (`is_internal`) toggles  
- Shop hourly rate  

### Bike Sales

- Consignment listing CRUD (via Supabase client + RLS)  
- Image upload / reorder / delete (`sales_images` bucket)  
- Status: available, sold, draft  

### Bikes

- Customer garage bikes used on invoices  
- Link to owner; VIN, plate, color, admin notes  
- Search / filter  

### Parts

- Catalog: description, optional part number, base price  

### Labor

- Hours by employee from service line items  
- Date ranges: current pay period, weekly, monthly  
- Filter by invoice status; per-mechanic breakdown  

### Employees

- Mechanic / staff roster for labor tracking and invoice assignment  

### Stats Board

- Revenue over a date range and status filters  
- Breakdown: services/labor, parts, hazardous waste  

### Users

- Rider account CRUD (email and/or phone)  
- Invite links and Supabase invite emails (including phone-only via placeholder email)  
- Confirmation status from Auth  

### Settings

- Shop name, address, phone, email, BAR number  
- Hourly rate, tax rate, hazardous waste rate  
- Pay period length (`weekly` / `bi-weekly` / `monthly`), anchor date, timezone  
- Default invoice list status filters  

---

## Authentication

| Route | Purpose |
|-------|---------|
| `/login` | Email or phone + password |
| `/signup` | Disabled — invite-only |
| `/accept-invite` | Complete invite (password + profile) |
| `/forgot-password` / `/reset-password` | Password recovery |
| `/auth/callback` | Auth code / token exchange |

**Roles**

- **Admin** — `app_metadata.role = "admin"` (set in Supabase Dashboard)  
- **Rider** — authenticated user without admin role  

Public self-signup is off; admins create riders and send invites.

---

## Domain concepts

### Two kinds of bikes

| Concept | Table | Purpose |
|---------|-------|---------|
| Garage bike | `bikes` | Customer-owned; linked to invoices |
| Sales listing | `bike_listings` | Consignment inventory for sale |

### Invoice statuses

`draft` → `estimate` → `in_progress` → `completed` → `paid` · `void`

- Unique invoice numbers  
- Customer snapshot fields for walk-ins  
- Line types: `service`, `part`, `hazardous_waste`  

### Pay periods

Configured in shop settings; used by the Labor tab to roll up mechanic hours.

---

## API overview

Frontend rewrites `/api/*` to the FastAPI backend (`BACKEND_API_URL`).

| Area | Examples |
|------|----------|
| **Public** | `GET /api/services` |
| **Portal** | `GET /api/portal/garage`, invoice print & photos, `PATCH /api/portal/profile` |
| **Admin** | Categories, services, shop settings, employees, labor, users/invites, bikes, parts, invoices, voice notes, invoice photos |

Consignment sales CRUD is handled in the frontend against Supabase (RLS), not the FastAPI admin router.

---

## Integrations

| Service | Use |
|---------|-----|
| **Supabase** | Database, Auth, Storage, RLS |
| **Resend** | Contact form email |
| **Google Gemini** | Mechanic voice-note transcription & summary |
| **Vercel** | Frontend hosting, Analytics, Speed Insights |
| **Google Maps** | Footer map / directions |

**Storage buckets**

- `sales_images` — public consignment photos  
- `invoice-photos` — private; served via signed URLs  

---

## Getting started

### Prerequisites

- Node.js + **Yarn 4.12**  
- Python **3.11+**  
- A Supabase project with migrations from `supabase/migrations/` applied  

### Install

```bash
yarn install
```

### Frontend

```bash
yarn workspace frontend dev
# http://localhost:3000
```

Environment (typical):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
BACKEND_API_URL=http://127.0.0.1:8000
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=https://www.advcycles.com
```

### Backend

```bash
cd apps/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Environment (typical):

```env
SUPABASE_URL=
SUPABASE_KEY=          # service role
GEMINI_API_KEY=        # or GOOGLE_API_KEY — voice notes
```

### Admin access

In **Supabase → Authentication → Users → App Metadata**:

```json
{ "role": "admin" }
```

See [`supabase/README.md`](./supabase/README.md) for RLS notes.

---

## Scripts

From the repo root:

| Command | Description |
|---------|-------------|
| `yarn workspace frontend dev` | Next.js dev server |
| `yarn workspace backend dev` | Backend (if scripted) / or `uvicorn` as above |
| `yarn lint` / `yarn format` | Biome (frontend) + Ruff (backend) |
| `yarn test` | Frontend Vitest + backend pytest |
| `yarn test:integration` | Live Supabase RLS tests |
| `yarn test:e2e` | Playwright |

More testing detail: [`apps/frontend/TESTING.md`](./apps/frontend/TESTING.md).

---

## Security notes

- Admin API and inventory writes require JWT `app_metadata.role = "admin"`  
- Customers get read-only access to public sales inventory  
- Invoice photos are private; portal/admin access goes through signed URLs  
- Invite-only signup; phone-only riders use a placeholder invite email domain  
